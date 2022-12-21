# IRMAseal mail utils
This library is meant to run in the browser to offer the following functionality:

- Parsing a PostGuard encrypted email to make it easier for clients to decrypt the email.
- Composing a PostGuard encrypted email to make it easier for clients to send an email encrypted with PostGuard.

Build the library via `npm run build-win` on Windows, or `npm run build-linux` on Linux.

## Examples

- For an example on how to compose and parse an email, see [examples/composeAndReadMail.ts](test/composeAndReadMail.ts)
- For an example on how an Exchange email is parsed, see [examples/readIrmaSealMail.ts](test/readExchangeMail.ts)

Run the examples by executing `npm run test`

## Prerequisites

Typescript needs to be installed to build the project.

Node needs to be installed to run the tests / examples.
