import axios from "axios";

export const publishContainer = async ({
    igUserId,
    accessToken,
    creationId,
}) => {
    const payload = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
    });

    const response = await axios.post(
        `https://graph.instagram.com/v25.0/${igUserId}/media_publish`,
        payload.toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data?.id;
};
