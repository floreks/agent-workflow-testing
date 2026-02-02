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

  it("can delete a message from the list", () => {
    const message = `Cypress-Delete ${Date.now()}`;

    cy.visit("/");
    cy.get('input[placeholder="What should the agent verify?"]').type(message);
    cy.contains("button", "Send").click();
    cy.get("ul").should("contain.text", message);

    cy.contains("li", message).within(() => {
      cy.contains("button", /Delete/i).click();
    });

    cy.get("ul").should("not.contain.text", message);
  });
});
