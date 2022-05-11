import {ComposeMail, ReadMail} from "./../dist/index";

console.log("\n\n====== composeMail.ts examples ======")

const CT: string = "ABCDEF"
const ATTACHMENT: string = "ATTACHMENTCONTENT"
const FILENAME: string = "ATTACHMENT.TXT"
const VERSION: string = "Version 1"
const enc = new TextEncoder()
const dec = new TextDecoder()

const composeMail = new ComposeMail()

composeMail.setSender("daniel.ostkamp@ru.nl")
composeMail.addRecipient("irmasealtest@gmail.com")
composeMail.setPayload(enc.encode(CT))
composeMail.setSubject("Test")

console.log("Composed mime mail: \n", composeMail.getMimeMail())

const readMail = new ReadMail()
readMail.parseMail(composeMail.getMimeMail())

const ctBytes = dec.decode(readMail.getCiphertext())
console.log("Readmail ct: ", ctBytes)
console.assert(CT.localeCompare(ctBytes)===0)