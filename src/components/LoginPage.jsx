import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';

function LoginPage() {

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8080/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            localStorage.setItem('token', data.token);
            console.log(data.token);
            navigate('/');

        } catch (err) {
            setError(err.response?.data?.error || 'Błąd logowania');
        }
    };

    return (
        <>

            <div>
                <br/>
                <h2>Logowanie</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '12px'}}>
                    <input type="email" placeholder="E-mail" value={formData.email}
                           onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input type="password" placeholder="Hasło" value={formData.password}
                           onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    <button type="submit">Zaloguj się</button>
                </form>
            </div>
        </>
    );
}

export default LoginPage;
