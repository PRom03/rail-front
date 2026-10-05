import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";

function DistancesIndex(){
const navigate=useNavigate();
    const [distances,setDistances] = useState([]);
    useEffect(() => {
        const getDistances = async () => {
            const res=await fetch("http://localhost:8080/api/distances/",{
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if(!res.ok) return await res.text();
            const data = await res.json();
            setDistances(data);
        }
        getDistances();
    })
    const handleDelete = async (distId) => {
        if (!window.confirm("Usunąć ten odcinek?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/distances/${distId}/delete`, {
                method: "DELETE",
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }

            });

            if (!res.ok) {
                throw new Error("Błąd usuwania");
            }

            setDistances(distances.filter(d => d.id !== distId));
        } catch {
            alert("Nie udało się usunąć odcinka");
        }
    };
    return (
        <><br/>
            <h2>Odcinki</h2>
            <button onClick={()=>navigate(`/distances/create`)}>
                Utwórz
            </button>
            <table width="100%" border="1" cellPadding="6">
                <thead>
                <tr>
                    <th className="text-left">Stacja 1</th>
                    <th className="text-left">Stacja 2</th>
                    <th className="text-left">Dystans</th>
                    <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {distances.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center">
                            Brak danych
                        </td>
                    </tr>
                )}

                {distances.map(d => (
                    <tr key={d.id}>
                        <td>
                            {d.station1.name}
                        </td>
                        <td>
                            {d.station2.name}
                        </td>
                        <td>
                            {d.distance}
                        </td>
                        <td className="space-x-2">
                            <button onClick={()=>navigate(`/distances/${d.id}`)}>
                                Edytuj
                            </button>
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="text-red-600"
                                style={{ color: "red" }}
                            >
                                Usuń
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

        </>
    )
}
export default DistancesIndex;