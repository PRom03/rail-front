import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function SeatReservation({segment,selectedSeat, onSelectSeat,train_id,train_date_id }) {

  const [carNumber, setCarNumber] = useState(selectedSeat?.carNumber || "");
  const [seatNumber, setSeatNumber] = useState(selectedSeat?.seatNumber || "");
  const [availableSeats,setAvailableSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [carsForType, setCarsForType] = useState([]);
  const [cartypes, setCartypes] = useState([]);
  const [selectedCartype, setSelectedCartype] = useState(null);
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [columns,setColumns] = useState([])
  const pluckObjectsByKey = (arr, key) => {
    return arr
        .map(item => item && item[key])
        .filter(v => v && typeof v === 'object' && !Array.isArray(v));
  }

  const checkAvailableSeatsForTrainDate=async(car_id,train_id,train_date_id)=>{
    try {
      const res = await fetch(`http://localhost:8080/api/seats/free/${car_id}/${train_id}/${train_date_id}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Error fetching seats");

      const data = await res.json();


      setAvailableSeats(data)
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const checkTrainCars = async () => {

      try {
        const res = await fetch(`http://localhost:8080/api/train-cars/${train_id}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) throw new Error("Error fetching cars");

        const data = await res.json();
        const data_=data.filter((element) => element.cartype.id === 4||element.cartype.id ===5);
        console.log("filtered: "+data_)
        setCars(data_);
        const cartypesTmp=pluckObjectsByKey(data_,'cartype')
        let uniqueCartypes= new Set();
        uniqueCartypes=cartypesTmp.filter(obj => {
          const key = JSON.stringify(obj);
          if (uniqueCartypes.has(key)) return false;
          uniqueCartypes.add(key);
          return true;
        });
        console.log("unique cartypesTMp: "+cartypesTmp)
        setCartypes(uniqueCartypes);
        console.log("cartypes: "+cartypes)
      } catch (e) {
        console.error(e);
      }
    };
    checkTrainCars();


  },[])
  const handleConfirm = () => {
    onSelectSeat({
      carNumber: Number(carNumber),
      seatNumber: Number(seatNumber),
      train_date_id,
    });
    setMessage("Wybrano miejsce.");
  };
  return (
    <div className="container mt-4 p-4 border rounded">
      <h3>Rezerwacja miejsca</h3>









        <>

          {cartypes.length> 0 && (
              <div style={{marginTop: 10}}>
                <p>{segment.train.name} {segment.stopFrom.station.name}{" → "}{segment.stopTo.station.name}</p>
                <strong>Wybierz typ wagonu:</strong>

                <select
                    value={selectedCartype ? selectedCartype.name : "Brak"}
                    onChange={(e) => {
                      const found = cartypes.find(d => d.name === e.target.value);
                      setSelectedCartype(found || {name: "Brak", value: 0});
                      setCarsForType(cars.filter(d => d.cartype.id===found.id));


                    }}
                >
                  <option value="">Brak</option>

                  {cartypes.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                  ))}


                </select>
              </div>
          )}
          <div className="card p-3" style={{"background-color":"blue",color:"aliceblue"}}>
            <h5>Wprowadź dane miejsca</h5>
            <div className="mb-3">
              {cars.length > 0 && (
                  <div style={{marginTop: 10}}>
                    <strong>Wybierz numer wagonu:</strong>

                    <select
                        value={carNumber ? carNumber : "Brak"}
                        onChange={async(e) => {
                          console.log("CarsForType"+carsForType);
                          const found = carsForType.filter(d => d.carNumber === Number(e.target.value));
                          console.log("found cars for type: "+found[0]);
                          setCarNumber(found[0].carNumber);
                          await checkAvailableSeatsForTrainDate(found[0].carNumber,train_id, train_date_id);
                          const chunk = (arr, size) =>
                              arr.reduce((acc, _, i) =>
                                  i % size ? acc : [...acc, arr.slice(i, i + size)], []);

                          setColumns(chunk(availableSeats, 10));
                        }}
                    >
                      <option value="">Brak</option>

                      {carsForType.map((d) => (
                          <option key={d.carNumber} value={d.carNumber}>
                            {d.carNumber}
                          </option>
                      ))}


                    </select>
                  </div>
              )}
            </div>
            <div>
              <strong>Wybierz miejsce:</strong>

              <select
                  value={seatNumber ? seatNumber : "Brak"}
                  onChange={ (e) => {
                    const newSeat = e.target.value;
                    setSeatNumber(newSeat);
                  }}
              >
                <option value="">Brak</option>

                {availableSeats.map((d) => (
                    <option key={d.id} value={d.number}>
                      {d.number}
                    </option>
                ))}


              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
              Zatwierdź
            </button>

          </div>
        </>


      {message && <div className="alert alert-warning mt-3" style={{"background-color":"blue",color:"lightblue"}}>{message}</div>}
    </div>
  );
}
export default SeatReservation;

