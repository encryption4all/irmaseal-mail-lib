import {ComposeMail, ReadMail} from "./../dist/index";

console.log("\n\n====== composeMail.ts examples ======")

const CT: string = "ABCDEF"
const ATTACHMENT: string = "ATTACHMENT"
const FILENAME: string = "ATTACHMENT"
const NONCE: string = "ATTACHMENT"
const VERSION: string = "Version 1"
const enc = new TextEncoder()

let composeMail = new ComposeMail()

composeMail.setSender("daniel.ostkamp@ru.nl")
composeMail.addRecipient("irmasealtest@gmail.com")
composeMail.setCiphertext(enc.encode(CT))
composeMail.setSubject("Test")
composeMail.setVersion("1")
composeMail.addAttachment(enc.encode(ATTACHMENT), FILENAME, NONCE)

console.log("Composed mime mail: \n", composeMail.getMimeMail())

let readMail = new ReadMail()

readMail.parseMail(composeMail.getMimeMail())

console.log("Readmail version: ", readMail.getVersion())

const ctBytes = new TextDecoder().decode(readMail.getCiphertext())
console.log("Readmail ct: ", ctBytes)

const attachment = readMail.getAttachments()[0]
const attachmentBytes = new TextDecoder().decode(attachment.body)
console.log("Readmail attachment: ", attachmentBytes)

console.assert(CT.localeCompare(ctBytes)===0)
console.assert(VERSION.localeCompare(readMail.getVersion())===0)
console.assert(ATTACHMENT.localeCompare(attachmentBytes)===0)
console.assert(FILENAME.localeCompare(attachment.fileName)===0)
console.assert(NONCE.localeCompare(attachment.nonce)===0)
