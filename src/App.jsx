
import './App.css'
import Layout from './components/Layout.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import ConnSearch from "./components/ConnSearch.jsx";
import ChooseConnDetails from "./components/ChooseConnDetails.jsx";
import CardTokenizer from "./components/CardTokenizer.jsx";
import TicketList from "./components/TicketList.jsx";
import TicketDetails from "./components/TicketDetails.jsx";
import EditUser from "./components/EditUser.jsx";
import DistancesIndex from "./components/DistancesIndex.jsx";
import DistanceCreate from "./components/DIstanceCreate.jsx";
import DistanceUpdate from "./components/DistanceUpdate.jsx";
import AddTrainDates from "../AddTrainDates.jsx";
import TrainList from "./components/TrainList.jsx";
import StationList from "./components/StationList.jsx";

function App() {

  return (
          <Routes>
              <Route path="/" element={<Layout />}>
                  <Route index element={<ConnSearch />} />
                  <Route path="login" element={<LoginPage/>}/>
                  <Route path="register" element={<RegisterPage/>}/>
                  <Route path="choose-conn-details" element={<ChooseConnDetails />}/>
                  <Route path="tokenize" element={<CardTokenizer/>}/>
                  <Route path="tickets" element={<TicketList />} />
                  <Route path="tickets/:id" element={<TicketDetails />} />
                  <Route path="panel" element={<EditUser/>}/>

                  <Route path="distances" element={<DistancesIndex/>}/>
                  <Route path="distances/create" element={<DistanceCreate/>}/>
                  <Route path="distances/:id" element={<DistanceUpdate/>}/>
                  <Route path="train-dates" element={<AddTrainDates />}/>
                  <Route path="trains" element={<TrainList/>}/>
                  <Route path="stations" element={<StationList/>}/>
              </Route>
          </Routes>
  )
}

export default App
