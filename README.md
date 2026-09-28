# Bank Ledger API

A REST API for user authentication, account management, and
account-to-account transactions. The project is built with Node.js,
Express, and MongoDB using Mongoose.

## Features

-   User registration, login, and logout
-   Password hashing with `bcrypt`
-   JWT-based authentication using an HTTP cookie or a Bearer token
-   Account creation and account listing
-   Account balance calculation from ledger entries
-   Account-to-account transactions
-   Idempotency keys to identify repeated transaction requests
-   Transaction statuses: `PENDING`, `COMPLETED`, `FAILED`, and
    `REVERSED`
-   Ledger entries for credits and debits
-   System-user-only endpoint for creating initial funds
-   Email notifications for registration, login, and logout

## Tech Stack

-   **Runtime:** Node.js
-   **Framework:** Express 5
-   **Database / ODM:** MongoDB / Mongoose
-   **Authentication:** JSON Web Tokens (`jsonwebtoken`)
-   **Password hashing:** `bcrypt`
-   **Cookies:** `cookie-parser`
-   **Email:** Nodemailer (Gmail SMTP)
-   **Environment variables:** `dotenv`

## Project Structure

``` text
Bank_Ledger_Project/
├── postman/
│   ├── collections/
│   ├── environments/
│   ├── globals/
│   ├── mocks/
│   └── specs/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── Models/
│   │   ├── account.model.js
│   │   ├── ledger.model.js
│   │   ├── tokenBlacklisted.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── Routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   ├── services/
│   │   └── mail.service.js
│   └── app.js
├── .env                 # Create locally; do not commit
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Getting Started

### Prerequisites

-   Node.js and npm
-   MongoDB
-   A Gmail account with an app password, if you want email
    notifications

### Installation

1.  Clone the repository:

    ``` bash
    git clone https://github.com/scratchLearner01/Advanced_Backend_Ledger.git
    cd Advanced_Backend_Ledger
    ```

2.  Install dependencies:

    ``` bash
    npm install
    ```

3.  Create a `.env` file in the project root.

    The application uses these environment variables:

      -----------------------------------------------------------------------
      Variable                            Purpose
      ----------------------------------- -----------------------------------
      `JWT_KEY`                           Secret used to sign and verify JWTs

      `EMAIL_USER`                        Gmail address used by Nodemailer

      `GOOGLE_APP_PASSWORD`               Gmail app password used for SMTP
                                          authentication

      MongoDB connection variable         Check `src/config/db.js` for the
                                          exact variable name
      -----------------------------------------------------------------------

    Use your own values. Do not commit `.env` or publish credentials.

4.  Start the development server:

    ``` bash
    npm run dev
    ```

    The server listens on port `8080`.

## API Reference

Base URL for local development:

``` text
http://localhost:8080
```

### Authentication

  ----------------------------------------------------------------------------
  Method            Endpoint               Description       Authentication
  ----------------- ---------------------- ----------------- -----------------
  `POST`            `/api/auth/register`   Register a user   No

  `POST`            `/api/auth/login`      Log in a user     No

  `POST`            `/api/auth/logout`     Log out and       Token required
                                           blacklist the     
                                           token             
  ----------------------------------------------------------------------------

#### Register

`POST /api/auth/register`

``` json
{
  "username": "your-name",
  "email": "you@example.com",
  "password": "your-password"
}
```

On successful registration, the API creates a user, issues a JWT, sets a
`token` cookie, and sends a registration email.

#### Login

`POST /api/auth/login`

``` json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

On successful login, the API issues a JWT and sets a `token` cookie. The
implementation also sends a login notification email.

#### Logout

`POST /api/auth/logout`

The endpoint accepts the token from the `token` cookie or the
`Authorization: Bearer <token>` header. It clears the cookie and adds
the token to the blacklist.

### Accounts

  ------------------------------------------------------------------------------------------------------
  Method            Endpoint                                         Description       Authentication
  ----------------- ------------------------------------------------ ----------------- -----------------
  `POST`            `/api/account/create`                            Create an account Yes
                                                                     for the logged-in 
                                                                     user              

  `GET`             `/api/account/balance?fromAccount=<accountId>`   Get an account's  Yes
                                                                     current balance   

  `GET`             `/api/account/`                                  List the          Yes
                                                                     logged-in user's  
                                                                     accounts          
  ------------------------------------------------------------------------------------------------------

#### Create an account

`POST /api/account/create`

No request body is required. The account is associated with the
authenticated user.

#### Get balance

`GET /api/account/balance?fromAccount=<accountId>`

Example:

``` text
GET /api/account/balance?fromAccount=YOUR_ACCOUNT_ID
```

The balance is calculated as the sum of credit ledger entries minus the
sum of debit ledger entries.

#### List accounts

`GET /api/account/`

Returns the accounts associated with the authenticated user.

### Transactions

  -----------------------------------------------------------------------------------------------
  Method            Endpoint                                  Description       Authentication
  ----------------- ----------------------------------------- ----------------- -----------------
  `POST`            `/api/transaction/`                       Transfer funds    Yes
                                                              between accounts  

  `POST`            `/api/transaction/system/initial-funds`   Create an         System user
                                                              initial-funds     
                                                              transaction       
  -----------------------------------------------------------------------------------------------

#### Transfer funds

`POST /api/transaction/`

``` json
{
  "fromAccount": "YOUR_SOURCE_ACCOUNT_ID",
  "toAccount": "RECIPIENT_ACCOUNT_ID",
  "amount": 100,
  "idempotencyKey": "unique-request-key"
}
```

The request requires a source account, destination account, amount, and
idempotency key. The source account must belong to the logged-in user,
and both accounts must be active. The API checks the source account's
available balance before creating the transaction.

The transaction is recorded with debit and credit ledger entries, and
the transaction status is updated as processing completes. Reuse the
same idempotency key when retrying the same request.

#### Create initial funds

`POST /api/transaction/system/initial-funds`

``` json
{
  "toAccount": "RECIPIENT_ACCOUNT_ID",
  "amount": 1000,
  "idempotencyKey": "unique-initial-funds-key"
}
```

This route is protected by system-user authorization. It creates a
transaction from the system user's account to the specified account.

## Data Models

-   **User:** email, username, password hash, and a `systemUser` flag.
-   **Account:** owner, status (`ACTIVE`, `FROZEN`, or `CLOSED`), and
    currency (defaults to `INR`).
-   **Transaction:** source account, destination account, amount,
    status, and a unique idempotency key.
-   **Ledger:** account, amount, transaction reference, and type
    (`CREDIT` or `DEBIT`). Ledger fields are marked immutable, and
    update/delete operations are blocked by middleware.
-   **Token blacklist:** stores logged-out tokens; entries are
    configured to expire after 24 hours.

## Authentication

Protected routes accept a JWT from either:

-   The `token` cookie, or
-   The `Authorization` header in the form `Bearer <token>`

JWTs are issued with a one-day expiration. Tokens recorded in the
blacklist are rejected.

## Testing with Postman

The repository includes a `postman/` directory for API testing
resources. Import the available collection and configure its environment
with your local base URL and test credentials.

## Notes

-   The server uses port `8080` in `server.js`.
-   MongoDB connection setup is handled by `src/config/db.js`; configure
    the connection variable according to that file.
-   Transaction handling uses MongoDB sessions and transactions. Your
    MongoDB deployment must support transactions (for example, a replica
    set).
-   This is a learning project. Review and test the implementation
    carefully before using it with real money or sensitive financial
    data.
