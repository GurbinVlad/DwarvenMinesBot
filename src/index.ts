import {Bot} from 'grammy';
import {randomInteger} from "./utilities.js";
import {TOKEN} from "./token.js"

const bot = new Bot(TOKEN);

bot.command("mine", (context) => {
    if(context.message === undefined){
        return;
    }
    const gems = randomInteger(-5, 10);
    let word: string;

    if(gems<0){
        if(gems+1===0){
            word = "gem";
        } else {
            word = "gems";
        }
        context.reply(`@${context.message.from.username}, you lost ${-gems} ${word}...`);
    }

    else if(gems===0){
        context.reply(`@${context.message.from.username}, you got nothing.`);
    }

    else{
        if(gems===1){
            word = "gem"
        } else {
            word = "gems"}
        context.reply(`@${context.message.from.username}, you got ${gems} ${word}!`);
    }

    console.log(`${context.message.from.username}: ${gems}`);
});


bot.start();
console.log("Bot created");