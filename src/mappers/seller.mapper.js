/**
 * Seller Mapper
 *
 * Converts Seller documents into API-safe response objects.
 *
 * Currently used as a lightweight DTO layer.
 * Future: replace with dedicated DTOs if response contracts
 * become significantly different from database entities.
 */
export const toSafeSeller = (seller) => {
    const obj = seller.toObject();

    delete obj.password;
    delete obj.refreshToken;
    delete obj.igAccessToken;
    delete obj.avatarPublicId;

    return obj;
};