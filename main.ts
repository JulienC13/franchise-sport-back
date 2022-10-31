import express, { NextFunction, Request, Response } from "express"
import morgan from "morgan"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const SECRET = "secret"
const PORT = 1234

// Initialisation de Express 4
const app = express()

// Activation de CORS pour les CORS...
app.use(cors())
// Activation de Morgan pour les logs
app.use(morgan("tiny"))
// Activation du raw (json)
app.use(express.json())
// Activation de x-wwww-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// Initialisation du client Prisma
const prisma = new PrismaClient()

enum Role {
  staff = "STAFF",
  partner = "PARTNER",
  structure = "STRUCTURE",
}

// app.post("/signup", async (req, res) => {
//   const { role } = req.body

//   if (
//     role &&
//     role != Role.partner &&
//     role != Role.staff &&
//     role != Role.structure
//   ) {
//     res.statusCode = 400
//     res.send({ message: "Wrong role provided" })
//     return
//   }

//   const user = await prisma.user.findFirst({ where: { email: req.body.email } })
//   if (user) {
//     res.statusCode = 409
//     res.send({
//       message: "An account is already assigned to this email",
//     })
//     return
//   }

//   // Plus y a de sel plus le mdp sera dur à brute force
//   const salt = await bcrypt.genSalt(10)
//   // Je gen un mdp crypté
//   const crypted_password = await bcrypt.hash(req.body.password, salt)

//   const { id, email } = await prisma.user.create({
//     data: {
//       email: req.body.email,
//       password: crypted_password,
//       role,
//     },
//   })

//   // Gérener un token
//   const access_token = jwt.sign({ id }, SECRET, { expiresIn: "3 hours" })
//   // Envoyer le token avec d'autres infos en bonus
//   res.send({ id, email, token: access_token })
// })

app.post("/login", async ({ body }, res) => {
  const user = await prisma[body.role.toLowerCase()].findUnique({
    where: {
      email: body.email,
    },
  })

  console.log(user)

  if (!user) return res.status(404).send({ message: "User not found" })

  // if (bcrypt.compareSync(body.password, user.password)) {
  if (body.password == user.password) {
    const { id, role } = user
    // Gérener un token

    const token = jwt.sign({ id, role }, SECRET, { expiresIn: "3 hours" })
    // Envoyer le token avec d'autres infos en bonus
    delete user.password
    return res.send({ ...user, token })
  }

  res.status(401).send({ message: "Wrong credentials" })
})

app.get(
  "/partners",
  auth,
  only_for(Role.staff),
  async (req: Request<{ user: any }>, res) => {
    const partners = await prisma.partner.findMany()

    res.send(partners)
  }
)

app.post("/partners", auth, only_for(Role.staff), async (req, res) => {
  const {
    body: { email, password, city },
  } = req
  try {
    const partner = await prisma.partner.create({
      data: {
        email,
        password,
        city,
      },
    })
    res.send(partner)
  } catch (error) {
    res.status(400).send({ message: error })
  }
})

app.put("/partners/:id", auth, only_for(Role.staff), async (req, res) => {
  const partner = await prisma.partner.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: req.body,
  })

  res.send(partner)
})

app.get(
  "/structures",
  auth,
  only_for(Role.partner),
  async (req: Request<{ user: any }>, res) => {
    const strucure = await prisma.structure.findMany({
      where: {
        // @ts-expect-error
        partnerId: req.user.id,
      },
    })

    res.send(strucure)
  }
)

app.post("/structures", auth, only_for(Role.partner), async (req, res) => {
  const {
    body: { email, password, street },
  } = req
  try {
    const { functionalities } = await prisma.structure.findUnique({
      where: { email: "grandplace@ob.io" },
      select: {
        functionalities: {
          select: {
            id: true,
          },
        },
      },
    })
    console.log(functionalities)

    const structure = await prisma.structure.create({
      data: {
        email,
        password,
        street,
        // @ts-expect-error
        partnerId: req.user.id,

        functionalities: {
          connect: functionalities,
        },
      },
    })
    res.send(structure)
  } catch (error) {
    res.status(400).send({ message: error })
  }
})

app.put("/structures/:id", auth, only_for(Role.partner), async (req, res) => {
  const structure = await prisma.structure.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: req.body,
  })

  res.send(structure)
})

app.put(
  "/functionality/:struc_id/:func_id",
  auth,
  only_for(Role.staff),
  async (req, res) => {
    const func = await prisma.structure.update({
      where: {
        id: parseInt(req.params.struc_id),
      },
      data: {
        functionalities: {
          update: {
            where: { id: parseInt(req.params.func_id) },
            data: req.body,
          },
        },
      },
    })

    res.send(func)
  }
)

app.get(
  "/functionalities-by-structure",
  auth,
  only_for(Role.staff),
  async (req, res) => {
    try {
      const functionalities = await prisma.structure.findMany({
        include: {
          functionalities: true,
          partner: true,
        },
      })
      res.send(functionalities)
    } catch (error) {
      res.status(400).send({ message: error })
    }
  }
)

app.get(
  "/my-functionalities",
  auth,
  only_for(Role.structure),
  async (req, res) => {
    try {
      const structure = await prisma.structure.findUnique({
        where: {
          // @ts-expect-error
          id: req.user.id,
        },
        include: {
          functionalities: true,
        },
      })
      res.send(structure)
    } catch (error) {
      res.status(400).send({ message: error })
    }
  }
)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

function auth(req: Request, res: Response, next: NextFunction) {
  // Récupération du token
  const token = req.headers.authorization?.split("Bearer ")[1]

  // Présence d'un token
  if (!token) return res.status(401).send({ message: "Error. Need a token" })

  // Véracité du token
  jwt.verify(token, SECRET, async (err, decoded_jwt: any) => {
    if (err) res.status(401).json({ message: "Error. Bad token" })
    else {
      const user = await prisma[decoded_jwt.role.toLowerCase()].findUnique({
        where: { id: decoded_jwt.id },
      })

      // @ts-expect-error
      req.user = user

      return next()
    }
  })
}

function only_for(role: Role) {
  return function only(req: Request, res: Response, next: NextFunction) {
    // @ts-expect-error
    if (req.user.role != role)
      return res
        .status(403)
        .send({ message: `Only ${role} users can do this action` })

    next()
  }
}

// Exclude keys from user
function exclude<User, Key extends keyof User>(
  user: User,
  ...keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key]
  }
  return user
}
