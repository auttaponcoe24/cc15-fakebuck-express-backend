const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../models/prisma");
const { registerSchema, loginSchema } = require("../validators/auth-validator");
const createError = require("../utils/create-error");

exports.register = async (req, res, next) => {
	try {
		const { value, error } = registerSchema.validate(req.body);
		if (error) {
			error.statusCode = 400;
			return next(error);
		}
		value.password = await bcrypt.hash(value.password, 12);
		// console.log(value); // {}
		const user = await prisma.user.create({
			data: value,
		});
		const payload = { userId: user.id };
		const accessToken = jwt.sign(
			payload,
			process.env.JWT_SECRET_KEY || "randomKey",
			{ expiresIn: process.env.JWT_EXPIRE }
		);
		delete user.password;
		res.status(201).json({ accessToken: accessToken, user });
	} catch (err) {
		next(err);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { value, error } = loginSchema.validate(req.body);
		if (error) {
			error.statusCode = 400;
			return next(error);
		}
		// SELELCT * FROM user WHERE email = emailOrMobile OR mobile = emailOrMobile
		const user = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: value.emailOrMobile },
					{ mobile: value.emilOrMobile },
				],
			},
		});
		if (!user) {
			// res.status(400).json({ message: "invalid credential" });
			return next(createError("invalid credential", 400));
		}

		const isMatch = await bcrypt.compare(value.password, user.password);
		if (!isMatch) {
			return next(createError("invalid credential", 400));
		}

		const payload = { userId: user.id };
		const accessToken = jwt.sign(
			payload,
			process.env.JWT_SECRET_KEY || "randomKey",
			{ expiresIn: process.env.JWT_EXPIRE }
		);
		delete user.password;
		res.status(200).json({ accessToken, user });
	} catch (err) {
		next(err);
	}
};

exports.getMe = (req, res) => {
	res.status(200).json({ user: req.user });
};
