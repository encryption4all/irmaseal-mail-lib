import {ComposeMail, ReadMail} from "./../dist/index";

console.log("\n\n====== composeMail.ts examples ======")

const CT: string = "ABCDEF"
const ATTACHMENT: string = "ATTACHMENT"
const enc = new TextEncoder()
const VERSION: string = "Version 1"

let composeMail = new ComposeMail()

composeMail.setSender("daniel.ostkamp@ru.nl")
composeMail.addRecipient("irmasealtest@gmail.com")
composeMail.setCiphertext(enc.encode(CT))
composeMail.setSubject("Test")
composeMail.setVersion("1")
composeMail.addAttachment(enc.encode(ATTACHMENT))

console.log("Composed mime mail: \n", composeMail.getMimeMail())

let readMail = new ReadMail()

readMail.parseMail(composeMail.getMimeMail())

console.log("Readmail version: ", readMail.getVersion())

const ctBytes = new TextDecoder().decode(readMail.getCiphertext())
console.log("Readmail ct: ", ctBytes)

const attachmentBytes = new TextDecoder().decode(readMail.getAttachments()[0])
console.log("Readmail attachment: ", attachmentBytes)

console.assert(CT.localeCompare(ctBytes)===0)
console.assert(VERSION.localeCompare(readMail.getVersion())===0)
console.assert(ATTACHMENT.localeCompare(attachmentBytes)===0)
