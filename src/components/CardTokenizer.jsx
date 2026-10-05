import React, {useEffect} from "react";
import {jwtDecode} from "jwt-decode";
function CardTokenizer() {
    useEffect(() => {
        var optionsForms = {
            cardIcon: true,
            style: {
                basic: {
                    fontSize: '24px',
                },
            },
            placeholder: {
                number: '',
                date: 'MM/YY',
                cvv: '',
            },
            lang: 'pl',
        }
        const saveCardToken = async (userId,token)=> {
            const res=fetch(`http://localhost:8080/api/users/${userId}/card-token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,

                    },
                    body: JSON.stringify({cardToken:token})
                }
                )
            if(!res.ok) {
                const text = await res.text;
                throw new Error(`Status: ${res.status} ${text}`);
            }
            await res.json();

        }
        var renderError = function (element, errors) {
            element.className = 'response-error'
            var messages = []
            errors.forEach(function (error) {
                messages.push(error.message)
            })
            element.innerText = messages.join(', ')
        }

        var renderSuccess = function (element, msg) {
            element.className = 'response-success'
            element.innerText = msg
        }

        var payuSdkForms = PayU('300746')
        var secureForms = payuSdkForms.secureForms()

        var cardNumber = secureForms.add('number', optionsForms)
        var cardDate = secureForms.add('date', optionsForms)
        var cardCvv = secureForms.add('cvv', optionsForms)

        cardNumber.render('#payu-card-number')
        cardDate.render('#payu-card-date')
        cardCvv.render('#payu-card-cvv')

        var tokenizeButton = document.getElementById('tokenizeButton')
        var responseElement = document.getElementById('responseTokenize')

        const handleClick = async () => {
            responseElement.innerText = "";

            try {
                const result = await payuSdkForms.tokenize("MULTI");
                if (result.status === "SUCCESS") {
                    renderSuccess(responseElement, result.body.token);
                    const user = jwtDecode(localStorage.getItem("token"));

                    await saveCardToken(user.id, result.body.token);
                } else {
                    renderError(responseElement, result.error.messages);
                }
            } catch (e) {
                console.error(e);
            }
        };
        tokenizeButton.addEventListener("click", handleClick);

        // sprzątanie — usuwa listener przy odmontowaniu
        return () => {
            tokenizeButton.removeEventListener("click", handleClick);
        };
    },[]);
return (<>

<section className="container">
    <div className="card-container">
        <aside>Card Number</aside>
        <div className="payu-card-form" id="payu-card-number"></div>

        <div className="card-details clearfix">
            <div className="expiration">
                <aside>Valid Thru</aside>
                <div className="payu-card-form" id="payu-card-date"></div>
            </div>

            <div className="cvv">
                <aside>CVV</aside>
                <div className="payu-card-form" id="payu-card-cvv"></div>
            </div>
        </div>
    </div>
    <button id="tokenizeButton">Tokenize</button>

    <div id="responseTokenize"></div>
</section></>
);
}
export default CardTokenizer;