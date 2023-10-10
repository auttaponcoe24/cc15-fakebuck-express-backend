const { STATUS_PENDING, STATUS_ACCEPTED } = require("../config/contants");
const prisma = require("../models/prisma");
const createError = require("../utils/create-error");
const {
	checkReceiverIdSchema,
	checkRequesterIdSchema,
	checkFriendIdSchema,
} = require("../validators/user-validator");

exports.requestFriend = async (req, res, next) => {
	try {
		const { value, error } = checkReceiverIdSchema.validate(req.params);
		if (error) {
			return next(error);
		}

		if (value.receiverId === req.user.id) {
			return next(createError("cannot request yourself", 400));
		}

		const targetUser = await prisma.user.findUnique({
			where: {
				id: value.receiverId,
			},
		});

		if (!targetUser) {
			return next(createError("user does not exist", 400));
		}

		// SELECT * FROM friend WHERE (requesterId = 1 AND receiverId = 2)
		// OR (requesterId = 2 AND receiverId = 1)
		const existRelationship = await prisma.friend.findFirst({
			where: {
				OR: [
					{ requesterId: req.user.id, receiverId: value.receiverId },
					{ requesterId: value.receiverId, receiverId: req.user.id },
				],
			},
		});

		if (existRelationship) {
			return next(createError("user already has relationship", 400));
		}

		await prisma.friend.create({
			data: {
				requesterId: req.user.id,
				receiverId: value.receiverId,
				status: STATUS_PENDING,
			},
		});
		res.status(201).json({ message: "request has been sent" });
	} catch (err) {
		next(err);
	}
};

exports.acceptRequest = async (req, res, next) => {
	try {
		const { value, error } = checkRequesterIdSchema.validate(req.params);
		if (error) {
			return next(error);
		}

		const existRelationship = await prisma.friend.findFirst({
			where: {
				requesterId: value.requesterId,
				receiverId: req.user.id,
				status: STATUS_PENDING,
			},
		});

		if (!existRelationship) {
			return next(createError("relationship dose not exist", 400));
		}

		await prisma.friend.update({
			data: {
				status: STATUS_ACCEPTED,
			},
			where: {
				id: existRelationship.id,
			},
		});

		res.status(200).json({ message: "accepted" });
	} catch (err) {
		next(err);
	}
};

exports.rejectRequest = async (req, res, next) => {
	try {
		const { value, error } = checkRequesterIdSchema.validate(req.params);
		if (error) {
			return next(error);
		}

		const existRelationship = await prisma.friend.findFirst({
			where: {
				receiverId: req.user.id,
				requesterId: value.requesterId,
				status: STATUS_PENDING,
			},
		});

		if (!existRelationship) {
			return next(createError("relationship does not exist", 400));
		}

		await prisma.friend.delete({
			where: {
				id: existRelationship.id,
			},
		});

		res.status(200).json({ message: "rejected" });
	} catch (err) {
		next(err);
	}
};

exports.cancelRequest = async (req, res, next) => {
	try {
		const { value, error } = checkReceiverIdSchema.validate(req.params);
		if (error) {
			next(error);
		}
		console.log(value);

		const existRelationship = await prisma.friend.findFirst({
			where: {
				requesterId: req.user.id,
				receiverId: value.receiverId,
				status: STATUS_PENDING,
			},
		});

		if (!existRelationship) {
			return next(createError("relationship does not exist", 400));
		}

		await prisma.friend.delete({
			where: {
				id: existRelationship.id,
			},
		});

		res.status(200).json({ message: "success cancellation" });
	} catch (err) {
		next(err);
	}
};

exports.unfriend = async (req, res, next) => {
	try {
		const { value, error } = checkFriendIdSchema.validate(req.params);
		if (error) {
			return next(error);
		}

		const existRelationship = await prisma.friend.findFirst({
			where: {
				OR: [
					{ requesterId: req.user.id, receiverId: value.friendId },
					{ requesterId: value.friendId, receiverId: req.user.id },
				],
				status: STATUS_ACCEPTED,
			},
		});

		if (!existRelationship) {
			return next(createError("relationship does not exist", 400));
		}

		await prisma.friend.delete({
			where: {
				id: existRelationship.id,
			},
		});

		res.status(200).json({ message: "friendship terminated" });
	} catch (err) {
		next(err);
	}
};
