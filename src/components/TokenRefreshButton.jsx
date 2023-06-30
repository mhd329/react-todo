import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';

import client from "../utils/client";

import cookie from "react-cookies";

import Swal from 'sweetalert2'

// 엑세스토큰 재발급 컴포넌트

function TokenRefreshButton(props) {
    const navigate = useNavigate();
    const goToLogin = () => {
        navigate("/account/login");
    };
    const [count, setCount] = useState(0); // 만료시간 설정을 위한 count
    const minutes = parseInt(count / 60);
    // seconds: 사용자 경험을 위해 소수점 이하는 버림 처리
    // 그리고 만료 시간의 차이로 소수점 정도의 차이가 있다면,
    // 서버의 만료시간보다 약간 일찍 만료되는 것이 예외 상황을 컨트롤 하기 쉬울것이라고 생각했다.
    const seconds = Math.floor(count % 60);

    useEffect(() => {
        async function getExp() {
            try {
                const response = await client.get("accounts/refresh",
                    {
                        headers: {
                            Authorization: `Bearer ${cookie.load("access") ? cookie.load("access") : null}`,
                        },
                    });
                const timer = (response.data.exp * 1000) - new Date().getTime();
                setCount(timer / 1000);
            } catch (error) {
                alert(error.response); // sweet alert2 를 사용하지 않음으로써 개발자가 의도하지 않은 에러라는 것을 나타내고 싶었다.
                console.log(error)
            };
        };
        getExp();
    }, []);
    useEffect(() => {
        const timer = setInterval(() => {
            setCount(count => count - 1);
        }, 1000);
        if (count < 0) {
            setCount(0);
            Swal.fire({
                title: "다시 로그인 해 주세요.",
                html: "로그인 시간이 만료되었습니다.",
                icon: "warning",
            });
            clearInterval(timer);
            goToLogin();
        };
        return () => clearInterval(timer);
    }, [count]);
    const handleClick = useCallback(() => {
        async function requestNewToken() {
            try {
                const response = await client.post("accounts/refresh", null, {
                    headers: {
                        Authorization: `Bearer ${cookie.load("access") ? cookie.load("access") : null}`,
                    },
                });
                const timer = (response.data.token.exp * 1000) - new Date().getTime();
                setCount(timer / 1000);
            } catch (error) {
                alert(error.response.data.message);
            };
        };
        requestNewToken();
    });
    return (
        <div className="refresh-button">
            <Button onClick={handleClick}><span>{minutes.toString().length === 2 ? minutes : "0" + minutes} : {seconds.toString().length === 2 ? seconds : "0" + seconds} </span>로그인 연장</Button>
        </div>
    );
}

export default TokenRefreshButton;