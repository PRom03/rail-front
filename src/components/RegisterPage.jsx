import React, { useState } from 'react';
import {Link, Outlet} from "react-router-dom";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname:'',
        email: '',
        password: '',
        role: 'client'

    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await fetch('http://localhost:8080/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Błąd rejestracji');
            }

            setMessage('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            setFormData({ firstname: '',lastname:'', email: '', password: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            

            <div className="max-w-md mx-auto mt-10 p-6 +shadow-lg rounded-xl" style={{"background-color":"darkblue",color:"aliceblue"}}>
                <h2 className="text-2xl font-bold mb-4 text-center">Rejestracja</h2>

                {message && <p className="text-green-600 mb-4">{message}</p>}
                {error && <p className="text-red-600 mb-4">{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '12px'}} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            name="firstname"
                            placeholder="Imię"
                            value={formData.firstname}
                            onChange={handleChange}
                            pattern="^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(-[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?$"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            name="lastname"
                            placeholder="Nazwisko"
                            value={formData.lastname}
                            onChange={handleChange}
                            pattern="^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(-[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?$"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="E-mail"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Hasło"
                        />
                    </div>

                    <button
                        type="submit"
                    >
                        Zarejestruj się
                    </button>
                </form>
            </div>
        </>
    );
};

export default RegisterPage;
