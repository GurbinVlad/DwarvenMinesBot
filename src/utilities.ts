import {characteristics, names} from "./NameList.js"
export function randomInteger(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomName(){
    const name = names[randomInteger(0,29)];
    const characteristic = characteristics[randomInteger(0,18)];
    return `${name} ${characteristic}`;
}