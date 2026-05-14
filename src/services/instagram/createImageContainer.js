import axios from "axios";

export const createImageContainer = async ({
    igUserId,
    accessToken,
    imageUrl,
    isCarouselItem = false,
    caption,
}) => {
    const payload = new URLSearchParams({
        image_url: imageUrl,
        access_token: accessToken,
    });

    if (isCarouselItem) {
        payload.append("is_carousel_item", "true");
    }

    if (caption) {
        payload.append("caption", caption);
    }

    const response = await axios.post(
        `https://graph.instagram.com/v25.0/${igUserId}/media`,
        payload.toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data?.id;
};
