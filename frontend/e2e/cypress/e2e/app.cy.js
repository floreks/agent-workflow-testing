describe("Message board", () => {
  it("homepage renders and health badge updates", () => {
    cy.visit("/");

    cy.contains("h1", "Message board").should("be.visible");
    cy.get(".badge")
      .invoke("text")
      .should("match", /ok|down/i);
  });

  it("can post a message and see it listed", () => {
    const message = `Cypress ${Date.now()}`;

    cy.visit("/");
    cy.get('input[placeholder="What should the agent verify?"]').type(message);
    cy.contains("button", "Send").click();
    cy.get("ul").should("contain.text", message);
  });

  it("can delete a message", () => {
    const message = `Cypress Delete Test ${Date.now()}`;

    cy.visit("/");
    cy.get('input[placeholder="What should the agent verify?"]').type(message);
    cy.contains("button", "Send").click();
    cy.get("ul").should("contain.text", message);

    // Click the delete button specifically for this message
    cy.get("li").contains(message).parents("li").find(".delete-btn").click();

    // The message should no longer exist
    cy.get("ul").should("not.contain.text", message);
  });
});
