export namespace Stores {
  interface user {
    name: string
    token?: string,
    id?: number | null
    email: string,
    phone: string,
    avatar: null,
    status: "active" | "inactive",
  }
}