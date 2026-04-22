const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    firstName: String
    lastName: String
    cedula: String
    status: String
    role: String
  }

  type Vehicle {
    id: ID!
    brand: String!
    model: String!
    year: Int!
    price: Float!
    description: String
    image: String
    ownerId: User
    status: String
    createdAt: String
  }

  type Query {
    # Get all active vehicles
    vehicles: [Vehicle]
    
    # Get a single vehicle by ID
    vehicle(id: ID!): Vehicle
    
    # Get the current logged in user profile
    me: User
  }
`;

module.exports = typeDefs;
