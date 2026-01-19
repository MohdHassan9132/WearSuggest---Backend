import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./src/public/temp");
    },
    filename: function (req, file, cb) {
        // const uniquename = Date.now() + "-" + file.originalname;
        cb(null, file.originalname);
    },
});

export const upload = multer({ storage });
