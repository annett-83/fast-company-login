import React, { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import userService from "../services/user.service";
import { toast } from "react-toastify";
import { setTokens } from "../services/localStorage.service";

const httpAuth = axios.create();
const AuthContext = React.createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
    const [currentUser, setUser] = useState();
    const [error, setError] = useState(null);

    async function singIn({ email, password }) {
        const key = "AIzaSyDgMJt8k035nest7iJyX78k7UAM8iMObh4";
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;
        try {
            const { data } = await httpAuth.post(url, {
                email,
                password,
                returnSecureToken: true
            });
            setTokens(data);
            await getUserData({ _id: data.localId, email, password });
        } catch (error) {
            errorCatcher(error);
            const { code, message } = error.response.data.error;
            // console.log(code, message);
            if (code === 400) {
                if (
                    message === "EMAIL_NOT_FOUND" ||
                    message === "INVALID_PASSWORD"
                ) {
                    const errorObject = {
                        password:
                            "Электронная почта или пороль введены некорректно"
                    };
                    throw errorObject;
                }
                if (
                    message.substring(0, 27) === "TOO_MANY_ATTEMPTS_TRY_LATER"
                ) {
                    const errorObject = {
                        password: "Слишком многопопыток, попробуйте позже"
                    };
                    throw errorObject;
                }
            }
        }
    }
    async function getUserData(data) {
        try {
            const { content } = userService.get(data);
            setUser(content);
        } catch (error) {
            errorCatcher(error);
        }
    }

    async function singUp({ email, password, ...rest }) {
        const key = "AIzaSyDgMJt8k035nest7iJyX78k7UAM8iMObh4";
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;
        try {
            const { data } = await httpAuth.post(url, {
                email,
                password,
                returnSecureToken: true
            });
            setTokens(data);
            await createUser({ _id: data.localId, email, ...rest });
        } catch (error) {
            errorCatcher(error);
            const { code, message } = error.response.data.error;
            // console.log(code, message);
            if (code === 400) {
                if (message === "EMAIL_EXISTS") {
                    const errorObject = {
                        email: "Пользователь с таким Email уже существует"
                    };
                    throw errorObject;
                }
            }
        }
    }
    async function createUser(data) {
        try {
            const { content } = userService.create(data);
            setUser(content);
        } catch (error) {
            errorCatcher(error);
        }
    }
    function errorCatcher(error) {
        const { message } = error.response.data;
        setError(message);
    }
    useEffect(() => {
        if (error !== null) {
            toast(error);
            setError(null);
        }
    }, [error]);

    return (
        <AuthContext.Provider value={{ singUp, singIn, currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ])
};

export default AuthProvider;
