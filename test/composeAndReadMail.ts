import {ComposeMail, ReadMail} from "./../dist/index";

console.log("\n\n====== composeMail.ts examples ======")

const CT: string = "ABCDEF"
const enc = new TextEncoder()
const VERSION: string = "Version 1"

let composeMail = new ComposeMail()

composeMail.setSender("daniel.ostkamp@ru.nl")
composeMail.addRecipient("irmasealtest@gmail.com")
composeMail.setCiphertext(enc.encode(CT))
composeMail.setSubject("Test")
composeMail.setVersion("1")

console.log("Composed mime mail: \n", composeMail.getMimeMail())

let readMail = new ReadMail()

readMail.parseMail(composeMail.getMimeMail())

console.log("Readmail version: ", readMail.getVersion())

const sealBytes = new TextDecoder().decode(readMail.getCiphertext())

console.log("Readmail ct: ", sealBytes)

console.assert(CT.localeCompare(sealBytes)===0)
console.assert(VERSION.localeCompare(readMail.getVersion())===0)
