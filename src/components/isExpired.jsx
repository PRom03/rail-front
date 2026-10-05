import {jwtDecode} from "jwt-decode";

export default function isExpired(token){
    if(!token) return true;
    const {exp}=jwtDecode(token);
    const curr=new Date().getTime()/1000;
    console.log(exp+" "+curr);
    if (exp <= curr ) {
        return true;
    }
    return false;
};