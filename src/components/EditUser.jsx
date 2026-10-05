import React, {useEffect, useState} from 'react';
import {Link, Outlet, useNavigate} from "react-router-dom";
import {jwtDecode} from "jwt-decode";

const EditUser = () => {
    const [discounts, setDiscounts] = useState([]);
    const navigate = useNavigate();
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);
    const [user,setUser]=useState({})

        useEffect(() => {
            const fetchUser = async () => {
                try {

                    const response = await fetch("http://localhost:8080/api/users/me",{
                        method: "GET",
                            headers:{

                                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                            }

                    });
                    if (!response.ok) throw new Error("Błąd pobierania danych użytkownika");
                    const data = await response.json();
                    console.log(data);
                    setUser(data);
                } catch (err) {
                    setError(err.message);
                }
            };
            fetchUser();
        }, []);
    useEffect(() => {
        if (user) {
            setFormData({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                password: '',
                discount: user.discount ?? null,
                cardToken: user.cardToken ?? null
            });
        }
    }, [user]);
    const [formData, setFormData] = useState({

        firstname: '',
        lastname:'',
        email: '',
        password: '',
        discount : null,
        cardToken: null

    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleFetchDiscounts = async () => {
        try {
            setLoadingDiscounts(true);
            setError(null);
            const response = await fetch("http://localhost:8080/api/discounts/");
            if (!response.ok) throw new Error("Błąd pobierania listy ulg");
            const data = await response.json();
            setDiscounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDiscounts(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await fetch(`http://localhost:8080/api/users/me/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Błąd rejestracji');
            }

            setMessage('Profil zaktualizowany.');
            setFormData({ firstname: '',lastname:'', email: '', password: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>

            <div><h1>Panel użytkownika</h1>
            <div className="max-w-md mx-auto mt-10 p-6 shadow-lg rounded-xl">
                <h2 className="text-2xl font-bold mb-4 text-center">Edytuj dane konta</h2>

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
                    {/*<div>
                        <button onClick={handleFetchDiscounts} disabled={loadingDiscounts}>
                            {loadingDiscounts ? "Pobieranie..." : "Pobierz dostępne ulgi"}
                        </button>
                    {discounts.length > 0 && (
                        <div style={{marginTop: 10}}>
                            <strong>Wybierz ulgę:</strong>

                            <select
                                value={selectedDiscount ? selectedDiscount.name : "Brak"}
                                onChange={(e) => {
                                    const found = discounts.find(d => d.name === e.target.value);
                                    setSelectedDiscount(found || {name: "Brak", value: 0});
                                }}
                            >
                                <option value="">Brak</option>

                                {discounts.map((d) => (
                                    <option key={d.name} value={d.name}>
                                        {d.name} ({d.value * 100}%)
                                    </option>
                                ))}


                            </select>
                        </div>
                    )}
                    </div>*/}
                    <button
                        type="submit"
                    >
                        Zmień dane
                    </button>
                </form>
            </div>
            <div>
                {user.role==='client'&&(
                <button onClick={()=>{navigate("/tickets")}}>
                    Moje bilety
                </button>
                )
                }
                {user.role==='admin'&&(<>
                    <button onClick={()=>{navigate("/trains")}}>
                        Zarządzaj pociągami
                    </button>
                    <button onClick={()=>{navigate("/stations")}}>
                Zarządzaj stacjami
            </button>
                    <button onClick={()=>{navigate("/distances")}}>
                        Zarządzaj stacjami i odległościami
                    </button>


                    </>)
                }

            </div>
            </div>
        </>
    );
};

export default EditUser;
