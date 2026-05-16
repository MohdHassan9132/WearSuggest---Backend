import axios from "axios";

export const getContainerStatus = async ({ creationId, accessToken }) => {
    const response = await axios.get(
        `https://graph.instagram.com/v25.0/${creationId}`,
        {
            params: {
                fields: "status_code,status",
                access_token: accessToken,
            },
        }
    );

    return {
        status: response.data?.status || null,
        statusCode: response.data?.status_code || null,
    };
};
