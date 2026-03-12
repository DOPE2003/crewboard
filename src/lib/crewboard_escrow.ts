export type CrewboardEscrow = {
  "version": "0.1.0",
  "name": "crewboard_escrow",
  "instructions": [
    {
      "name": "initializeEscrow",
      "accounts": [
        { "name": "buyer", "isMut": true, "isSigner": true },
        { "name": "seller", "isMut": false, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false },
        { "name": "buyerTokenAccount", "isMut": true, "isSigner": false },
        { "name": "escrowState", "isMut": true, "isSigner": false },
        { "name": "escrowTokenAccount", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "gigId", "type": "string" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "releaseFunds",
      "accounts": [
        { "name": "buyer", "isMut": true, "isSigner": true },
        { "name": "seller", "isMut": true, "isSigner": false },
        { "name": "escrowState", "isMut": true, "isSigner": false },
        { "name": "escrowTokenAccount", "isMut": true, "isSigner": false },
        { "name": "sellerTokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrowState",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "buyer", "type": "publicKey" },
          { "name": "seller", "type": "publicKey" },
          { "name": "mint", "type": "publicKey" },
          { "name": "escrowTokenAccount", "type": "publicKey" },
          { "name": "gigId", "type": "string" },
          { "name": "amount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};

export const IDL: CrewboardEscrow = {
  "version": "0.1.0",
  "name": "crewboard_escrow",
  "instructions": [
    {
      "name": "initializeEscrow",
      "accounts": [
        { "name": "buyer", "isMut": true, "isSigner": true },
        { "name": "seller", "isMut": false, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false },
        { "name": "buyerTokenAccount", "isMut": true, "isSigner": false },
        { "name": "escrowState", "isMut": true, "isSigner": false },
        { "name": "escrowTokenAccount", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "gigId", "type": "string" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "releaseFunds",
      "accounts": [
        { "name": "buyer", "isMut": true, "isSigner": true },
        { "name": "seller", "isMut": true, "isSigner": false },
        { "name": "escrowState", "isMut": true, "isSigner": false },
        { "name": "escrowTokenAccount", "isMut": true, "isSigner": false },
        { "name": "sellerTokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrowState",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "buyer", "type": "publicKey" },
          { "name": "seller", "type": "publicKey" },
          { "name": "mint", "type": "publicKey" },
          { "name": "escrowTokenAccount", "type": "publicKey" },
          { "name": "gigId", "type": "string" },
          { "name": "amount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};
