import React, {useCallback} from "react";
import {useNavigate} from "react-router-dom";
//const token = localStorage.getItem("token");
function ReturnTicket({orderId}) {
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [returned, setReturned] = React.useState(false);
    const GET_TOKEN="/api-proxy//pl/standard/user/oauth/authorize";
    const CLIENT_ID="300746";
    const CLIENT_SECRET="2ee86a66e5d97e3fadc400c9f19b065d";
    const POST_ORDER="/api-proxy//api/v2_1/orders";
    const navigate=useNavigate();
    const fetchToken = async () => {

        const body = new URLSearchParams();
        body.append("client_id", CLIENT_ID);
        body.append("client_secret", CLIENT_SECRET );
        body.append("grant_type", "client_credentials");
        const res = await fetch(GET_TOKEN, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token request failed: ${res.status} ${text}`);
        }
        const json = await res.json();
        if (!json.access_token) throw new Error("Brak access_token w odpowiedzi tokenu");
        return json.access_token;
    };
    const RequestReturnTicket = async (token) => {
        let refund;
        try {
            const res = await fetch(
                `${POST_ORDER}/${orderId}/refunds`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        refund: {
                            description: "refund"
                        }
                    })
                }
            );
            refund = await res.json();
        } catch (err) {
            console.log(err);
        }
        return refund;
    }
    const GetReturnStatus = async (refund,token) => {
        let gotRefund;
        if (refund.status.statusCode === "SUCCESS") {
            try {
                const res = await fetch(
                    `${POST_ORDER}/${orderId}/refunds/${refund.refund.refundId}`, {
                        method: 'GET',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        }
                    }
                );
                gotRefund = await res.json();
            } catch (err) {
                console.log(err);
            }

        }
        return gotRefund.status;
    }
    const updateTicket = async (status,paymentId)=>{

            const res= await fetch(`http://localhost:8080/api/tickets/update/${orderId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({status: status,paymentId:paymentId})
                });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Status: ${res.status} ${text}`);
        }
        await res.json();
    }
    const handleReturn = useCallback(async () => {
        setLoading(true);
        setMessage("");
        const token=await fetchToken();
        const refund = await RequestReturnTicket(token);
        const status = await GetReturnStatus(refund,token);
        let statusMessage;
        if(status==="PENDING" || status==="FINALIZED"){
            statusMessage="Zwrot zlecony pomyślnie."
            await updateTicket("returned");
            setReturned(true);

        }
        else statusMessage="Błąd zwrotu.";
        setMessage(statusMessage);
        setLoading(false);
        console.log("msg "+statusMessage);
        console.log("loading "+loading);
        console.log("returned "+returned);
    }
    ,[]);

    return (
        <div className="flex flex-col items-center space-y-3">
            <button
                onClick={handleReturn}
                disabled={loading===true || returned===true}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    loading || returned ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                {loading ? "Przetwarzanie..." : returned ? "Zwrócono" : "Zleć zwrot biletu"}
            </button>

            {message && (

                <p>{message}</p>

            )}

        </div>
    );
}
export default ReturnTicket;