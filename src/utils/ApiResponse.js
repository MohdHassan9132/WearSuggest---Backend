class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.data = data;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode < 400;

        /* The condition statusCode < 400 means:
        1. Informational responses (100–199) — request received and understood.
        2. Successful responses (200–299) — request processed successfully.
        3. Redirection messages (300–399) — request handled, but client must redirect.
        4. Client errors (400–499) are NOT considered successful.
        5. Server errors (500–599) are NOT considered successful.
        */
    }
}
export { ApiResponse };
