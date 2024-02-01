import { Router } from "express";
import mongoose, { mongo } from "mongoose";
import cartsModel from "../models/carts.models.js";
import productsModel from "../models/products.models.js";

import { handlePolicies } from "../utils.js";

const router = Router();

class Carts {
  static carts = [];

  constructor() {
    this.products = [];
  }
}

router.post("/", async (req, res) => {
  try {
    const newCart = new Carts();
    const newCardDb = await cartsModel.create(newCart);

    res.status(200).send(`Su carrito con ID:${newCardDb._id} ha sido creado`);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cId = req.params.cid;
    const cart = await cartsModel
      .findOne({ _id: cId })
      .populate({ path: "products", model: productsModel })
      .lean();
    res.status(200).send(cart);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.post(
  "/:cid/products/:pid",
  handlePolicies(["USER"]),
  async (req, res) => {
    try {
      const cartId = req.params.cid;
      const productId = req.params.pid;

      const productIdObj = new mongoose.Types.ObjectId(productId);

      const cart = await cartsModel.findOne({ _id: cartId });

      if (
        cart.products.some((product) => product.productId.equals(productIdObj))
      ) {
        await cartsModel.updateOne(
          { _id: cartId, "products.productId": productIdObj },
          { $inc: { "products.$.quantity": 1 } }
        );
      } else {
        await cartsModel.updateOne(
          { _id: cartId },
          { $push: { products: { productId: productIdObj, quantity: 1 } } }
        );
      }

      res.status(200).send(`Se agrego el producto con id: ${productIdObj}`);
    } catch (err) {
      res.status(400).send({ status: "ERR", data: err.message });
    }
  }
);

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    await cartsModel.updateOne(
      { _id: cartId },
      { $pull: { products: { productId: productId } } }
    );

    res.status(200).send({ status: "OK", data: "Product removed from cart" });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

export default router;
