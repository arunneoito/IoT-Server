/* eslint-disable no-use-before-define */

const express = require("express");

const router = express.Router();
const Joi = require("joi");

const authorize = require("../middlewares/auth.middleware");
const SectionService = require("../services/section.service");
const validateRequest = require("../middlewares/validation.middleware");

router.post("/create", authorize(), sectionSchema, createSection);
router.get("/getSectionTypes", authorize(), getSectionsTypes);

function sectionSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    typeId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function createSection(req, res, next) {
  SectionService.createSection({ user: req.user, ...req.body })
    .then(() => {
      res.status(200).send({ message: "Created Succesfully", error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function getSectionsTypes(req, res, next) {
  SectionService.getSectionTypes()
    .then((data) => {
      res.status(200).send({ data, message: "Succes", error: false });
    })
    .catch((e) => {
      next(e);
    });
}

module.exports = router;
