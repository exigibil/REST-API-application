const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../../app");
const User = require("../../../models/Users");



const { describe, it, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');



describe("POST /api/users/login", () => {

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should return 200 status code and a token with user details", async () => {
    
    const user = new User({
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
      subscription: "starter",
    });
    await user.setPassword("testpassword");
    await user.save();

    const response = await request(app)
      .post("/api/users/login")
      .send({
        email: "testuser@example.com",
        password: "testpassword",
      })
      .expect(200);

  
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.user).toEqual({
      email: "testuser@example.com",
      subscription: "starter",
    });
  });

  it("should return 401 status code for invalid credentials", async () => {

    const response = await request(app)
      .post("/api/users/login")
      .send({
        email: "invaliduser@example.com",
        password: "wrongpassword",
      })
      .expect(401);


    expect(response.body.status).toBe("error");
    expect(response.body.code).toBe(401);
    expect(response.body.message).toBe("Incorrect email or password");
  });

  it("should return 400 status code for missing email or password", async () => {

    let response = await request(app)
      .post("/api/users/login")
      .send({
        password: "testpassword",
      })
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.code).toBe(400);


    response = await request(app)
      .post("/api/users/login")
      .send({
        email: "testuser@example.com",
      })
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.code).toBe(400);
  });
});
