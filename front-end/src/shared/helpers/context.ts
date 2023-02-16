import React from "react"
import { SortingField, SortingOrder } from "staff-app/daily-care/home-board.page"

export interface HomeBoardContext {
  handleSelectField: (value: React.ChangeEvent<HTMLSelectElement>) => void
  handleInputQuery: (value: React.ChangeEvent<HTMLInputElement>) => void
  searchText?: string
  sortOrder?: SortingOrder
  sortBy?: SortingField
}

const fallback = (): never => {
  throw new Error("You forgot to wrap your component in HomeBoardProvider")
}

const initialContext: HomeBoardContext = {
  handleSelectField: fallback,
  handleInputQuery: fallback,
  searchText: "",
}

const HomeBoardContext = React.createContext<HomeBoardContext>(initialContext)

export default HomeBoardContext
