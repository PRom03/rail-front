import React from 'react';
import {Link, Navigate, Outlet, useNavigate} from 'react-router-dom';
import ConnSearch from "./ConnsList.jsx";
import isExpired from "./isExpired.jsx";
const Layout = () => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };
    if (!token) {
        //return <Navigate to="/login" />;
    }


    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top" style={{ top: 0, left: 0, right: 0, margin: 0 }}>
                <div className="container-fluid px-3">
                    <Link className="navbar-brand d-flex align-items-center" to="/">
                        <span className="fs-4 me-2"></span>
                        <span className="fs-5">Bilety kolejowe online</span>
                    </Link>

                    <div className="collapse navbar-collapse">
                        <div className="ms-auto d-flex gap-2">
                            {!isExpired(token) ? (
                                <>
                                    <Link to="/panel" className="btn btn-outline-light me-2">
                                        Panel
                                    </Link>
                                    <button className="btn btn-light text-dark" onClick={handleLogout}>
                                        Wyloguj
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn btn-outline-light me-2">
                                        Zaloguj się
                                    </Link>
                                    <Link to="/register" className="btn btn-light text-dark">
                                        Zarejestruj się
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
<Outlet></Outlet>
        </>
    );
};

export default Layout;
