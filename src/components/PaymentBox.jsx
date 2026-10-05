import React, {useState} from "react";
import {jwtDecode} from 'jwt-decode'
import {useNavigate} from "react-router-dom";

const EXT_USR="-user-rail-99675"
const GET_TOKEN="/api-proxy//pl/standard/user/oauth/authorize";
const CLIENT_ID="300746";
const CLIENT_SECRET="2ee86a66e5d97e3fadc400c9f19b065d";
const POST_ORDER="/api-proxy//api/v2_1/orders";
const T_EXT="-of-tickets-rail-99675";
function PaymentBox({ amount, onSuccess, onError, discount,connection,seats,trainDateIds,hasLuggage,hasBike,hasDog }) {
  const [method, setMethod] = useState("blik");
  const [blikCode, setBlikCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [bought, setBought] = useState(false);
  let user,ticket,paymentMethod,paymentValue;
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState(null);

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
  const updateTicket = async (orderId,status,payment_id)=>{

    const res=await fetch(`http://localhost:8080/api/tickets/update/${orderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({status: status,paymentId:payment_id})
        });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Status: ${res.status} ${text}`);
    }
    await res.json();
  }
const createOrder = async (extOrderId) => {
  console.log("hasBike"+hasBike );
  console.log("hasLuggage"+ hasLuggage );
  console.log("hasDog"+ hasDog );
  ticket = {
    userId: user.id,
    discountId: discount.id,
    hasDog: Boolean(hasDog),
    hasBike: Boolean(hasBike),
    hasLuggage: Boolean(hasLuggage),
    price: amount,
    status: "pending",
    extId: extOrderId
  };

  const res = await fetch("http://localhost:8080/api/tickets/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Order create failed: ${res.status} ${errText}`);
  }
  return await res.json(); 
};


const saveConnection = async (ticketId) => {
  const payload = connection.map((c,index) => ({
    stopFromId: c.stopFrom.id,
    stopToId: c.stopTo.id,
    trainDateId: trainDateIds[index],
    distance: c.distance,
    ticketId: ticketId

  }));

  const res=await fetch("http://localhost:8080/api/travel-stages/", {
    method: "POST",
    headers: { "Authorization":`Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    return await res.text();
  }
  return await res.json();
};
const savePayment = async (ticket_,payment_method)=>{
  const payload = {
    extId:ticket_.properties[0].value,
    methodName:payment_method

  };

  const res=await fetch("http://localhost:8080/api/payments/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Payment save failed: ${res.status} ${errText}`);
  }
  return await res.json();
}
const buyATicket = async (connection,seats,discountId,amount,trainDateIds) => {
  const payload={
    connection,
    seats,
    discountId,
    amount,
    trainDateIds
  }
  const res=await fetch("http://localhost:8080/api/tickets/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Payment save failed: ${res.status} ${errText}`);
  }
  return await res.json();
}
const handlePay = async () => {
  setMessage(null);
  if (!canPay()) {
    setMessage("Niepoprawne dane (np. kod BLIK musi mieć 6 cyfr).");
    return;
  }
  setLoading(true);
  try {
    user = jwtDecode(localStorage.getItem("token"));
    setMessage("Pozyskiwanie tokenu...");
    const token = await fetchToken();
    const lastId=await fetchLastTicketId();
    const card_token=await getCardToken(user.id);
    setMessage("Wysyłanie żądania do operatora...");
    const externalResult = await callExternalPayment(token,lastId.ticketId+1,card_token.cardToken);
    setMessage("Tworzenie biletu...");
    const createdTicket = await createOrder(externalResult.orderId );
    ticket = createdTicket;
    setMessage("Zapisywanie połączenia...");
    const conn=await saveConnection(ticket.id);
    if(typeof conn==="string"||conn instanceof String){
      setMessage(conn)
      await updateTicket(externalResult.orderId, "cancelled", null)
      return;
    }

      for (let i = 0; i < connection.length; i++) {
        const seat = seats[connection[i].stageKey]; if (!seat) continue;
        const seatResMsg = await handleSeatReservation(conn[i].id, seat, i);
        if (typeof seatResMsg === "string" || seatResMsg instanceof String) {
          setMessage(seatResMsg);
          await updateTicket(externalResult.orderId, "cancelled", null)
          return;
        }
      }
    const paymentStatus=await getPaymentStatus(token, externalResult.orderId);
    if(paymentStatus.orders[0].status==="CANCELED"){
      setMessage("Płatność anulowana.");
      const payment = await savePayment(paymentStatus, paymentMethod);
      await updateTicket(externalResult.orderId, "cancelled", payment.id)
    }
    else if(paymentStatus.status.statusCode==="SUCCESS") {
      setMessage("Płatność zakończona pomyślnie.");
      setBought(true); setTicketId(ticket.id);
      const payment = await savePayment(paymentStatus, paymentMethod);
      await updateTicket(externalResult.orderId, "bought", payment.id);
    }
    setLoading(false);
    if (onSuccess) onSuccess({ externalResult, ticket });
  } catch (err) {
    console.error("PaymentBox error:", err);
    setLoading(false); setMessage(`Błąd: ${err.message || err}`);
    if (onError) onError(err);
  }
};
  const getCardToken = async (userId) => {
    const res=await fetch(`http://localhost:8080/api/users/card-token`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({userId: userId})
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token request failed: ${res.status} ${text}`);
      }
     return await res.json();
  }
  const callExternalPayment = async (token,ticketId,card_token) => {
    let payload;
    if (method === "blik") {
      paymentMethod="BLIK_AUTHORIZATION_CODE"
      paymentValue=blikCode
    }
    else {
      paymentMethod="CARD_TOKEN";
      paymentValue=card_token
    }
      payload = {
        customerIp:"127.0.0.1",
        merchantPosId: "300746",
        orderId:ticketId,
        description: "descr",
        extOrderId: ticketId+T_EXT,
        currencyCode: "PLN",
        totalAmount: amount*100,
        validityTime: "100000",
        continueUrl: `https://ichthyic-jodi-nonmaritally.ngrok-free.dev/tickets/${ticketId}`,
        payMethods: {

          payMethod: {
            type: paymentMethod,
            value: paymentValue,
          }
        },
        products: [
            {

              name: "Ticket",
              unitPrice: amount*100,
              quantity: 1,
              virtual: true

            }
          ],
          buyer: {

            extCustomerId: user.id+EXT_USR,
            email: user.email,
            phone: "+48 123456789",
            firstName: user.firstName,
            lastName: user.lastName,
            nin: 123456789,
            language: "pl",
            birthDate: "1970-01-01T00:00:00.000+01:00"
          }






      };



    const res = await fetch(POST_ORDER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`External payment failed: ${res.status} ${errText}`);
    }
    return await res.json(); 
  };
  const fetchLastTicketId = async () => {
    const res = await fetch("http://localhost:8080/api/tickets/last",{
      method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Nie udało się pobrać ID biletu: ${res.status} ${text}`);
    }
    const lastId = await res.json();
    return lastId;
  };
  const getPaymentStatus = async (token,extOrderId) => {
    user=jwtDecode(localStorage.getItem("token"));


    const res = await fetch(`${POST_ORDER}/${extOrderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`External payment failed: ${res.status} ${errText}`);
    }
    return await res.json();
  };



  const isBlikValid = () => /^\d{6}$/.test(blikCode);
  const canPay = () => {
    if (loading) return false;
    if (method === "blik") return isBlikValid();
    return true;
  };
  const handleSeatReservation = async (travelStageId,seat,index) =>{
	  const payload={
		      trainDateId:trainDateIds[index],
			  carNumber:seat.carNumber,
			  seatNumber:seat.seatNumber,
			  travelStageId:travelStageId

	  };
	   const res = await fetch(`http://localhost:8080/api/travel-stages/reserve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
	  body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return await res.text();
    }
    return await res.json();
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
      <h4 style={{ margin: "0 0 8px 0" }}>Metoda płatności</h4>

      <div role="radiogroup" aria-label="Metoda płatności" style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 6 }}>
          <input
            type="radio"
            name="paymentMethod"
            value="blik"
            checked={method === "blik"}
            onChange={() => setMethod("blik")}
          />{" "}
          BLIK
        </label>
        {/*
        <label style={{ display: "block", marginBottom: 6 }}>
          <input
            type="radio"
            name="paymentMethod"
            value="karta"
            checked={method === "karta"}
            onChange={() => setMethod("karta")}
          />{" "}
          Karta (zapisana)
        </label>*/}
      </div>

      {method === "blik" && (
        <div style={{ marginBottom: 10 }}>
          <label>
            Kod BLIK (6 cyfr):{" "}
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={blikCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setBlikCode(v);
              }}
              disabled={loading}
              aria-label="Kod BLIK"
            />
          </label>
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={handlePay}
          disabled={!canPay()}
          style={{
            padding: "8px 12px",
            cursor: canPay() ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Proszę czekać..." : `Zapłać ${typeof amount === "number" ? amount.toFixed(2) : amount} PLN`}
        </button>

        <button
          onClick={() => {
            setMethod("blik");
            setBlikCode("");
            setMessage(null);
          }}
          disabled={loading}
        >
          Wyczyść
        </button>
      </div>

      {message && <div style={{ marginTop: 10 }}>{message}</div>}
      {bought===true && ticketId &&(
          <button onClick={()=>{navigate(`/tickets/${ticketId}`)}}>
            Wyświetl bilet
          </button>
      )
      }
    </div>
  );
}
export default PaymentBox;