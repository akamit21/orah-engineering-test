import React, { useState, useEffect, useContext, useRef } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/ButtonBase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Spacing, BorderRadius, FontWeight, FontSize } from "shared/styles/styles"
import { Colors } from "shared/styles/colors"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { Person } from "shared/models/person"
import { useApi } from "shared/hooks/use-api"
import { StudentListTile } from "staff-app/components/student-list-tile/student-list-tile.component"
import { ActiveRollOverlay, ActiveRollAction } from "staff-app/components/active-roll-overlay/active-roll-overlay.component"
import { faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons"
import { RolllStateType } from "shared/models/roll"
import HomeBoardContext from "shared/helpers/context"
import { useDebounce } from "shared/hooks/use-debounce"

export enum SortingField {
  FirstName = "first_name",
  LastName = "last_name",
}

export enum SortingOrder {
  ASC = "asc",
  DSC = "dsc",
}

export const HomeBoardPage: React.FC = () => {
  const [isRollMode, setIsRollMode] = useState<boolean>(false)
  const [studentsList, setStudentsList] = useState<Person[]>([])
  const [sortOrder, setSortOrder] = useState<SortingOrder>(SortingOrder.ASC)
  const [sortBy, setSortBy] = useState<SortingField>(SortingField.FirstName)
  const [searchText, setSearchText] = useState<string>("")
  const [attendanceCount, setAttendanceCount] = useState<any>({ all: 0, present: 0, late: 0, absent: 0 })

  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({ url: "get-homeboard-students" })
  const [saveRollState] = useApi({ url: "save-roll" })

  const searchQuery = useDebounce(searchText, 800)

  useEffect(() => {
    void getStudents()
  }, [getStudents])

  useEffect(() => {
    if (data?.students) {
      setStudentsList(data.students)
    }
  }, [data])

  useEffect(() => {
    let present = 0
    let absent = 0
    let late = 0
    for (let index in studentsList) {
      if (studentsList[index].hasOwnProperty("attendance")) {
        if (studentsList[index].attendance === "present") {
          present++
        } else if (studentsList[index].attendance === "absent") {
          absent++
        } else if (studentsList[index].attendance === "late") {
          late++
        }
      }
    }
    setAttendanceCount({ all: present + absent + late, present: present, absent: absent, late: late })
  }, [studentsList])

  useEffect(() => {
    filterList(searchQuery.trim().toLowerCase())
  }, [searchQuery])

  /**
   * function to update selected sortby property
   * @param e
   */
  const handleSelectField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    setSortBy(e.target.value as SortingField)
  }

  /**
   * function to handle search text and update the state
   * @param e
   */
  const handleInputQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setSearchText(e.target.value as string)
  }

  /**
   * function to update student attendance in local state
   * @param value
   * @param studentId
   */
  const handleUpdateAttendance = (value: RolllStateType, studentId: number) => {
    const updatedStudentData = studentsList.map((studentObj) => {
      if (studentObj.id == studentId) {
        studentObj.attendance = value
      }
      return studentObj
    })

    setStudentsList([...updatedStudentData])
  }

  const sortStudentsList = () => {
    let studentsArr = [...studentsList]
    studentsArr.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) {
        return sortOrder === SortingOrder.ASC ? -1 : 1
      }
      if (a[sortBy] > b[sortBy]) {
        return sortOrder === SortingOrder.ASC ? 1 : -1
      }
      return 0
    })

    setStudentsList(studentsArr)
  }

  /**
   * function to filter student data by user query
   * @param q
   */
  const filterList = (q: string) => {
    if (q.length > 0 && data?.students) {
      let filteredStudentsArr = [...data?.students].filter((student) => {
        return student.first_name.toLowerCase().indexOf(q) != -1 || student.last_name.toLowerCase().indexOf(q) != -1
      })
      setStudentsList(filteredStudentsArr)
    } else {
      data?.students && setStudentsList([...data?.students])
    }
  }

  /**
   * toolbar function
   * @param action
   */
  const onToolbarAction = (e: { target: { nodeName: string } }, action: ToolbarAction) => {
    if (action === "roll") {
      setIsRollMode(true)
    } else if (action == "sort") {
      let sortingOrder = sortOrder
      if (e.target.nodeName === "svg") {
        if (sortOrder === SortingOrder.ASC) {
          sortingOrder = SortingOrder.DSC
        } else {
          sortingOrder = SortingOrder.ASC
        }
      }
      setSortOrder(sortingOrder)
      sortStudentsList()
    }
  }

  const onActiveRollAction = (action: ActiveRollAction, selectedType?: string) => {
    if (action === "exit") {
      setIsRollMode(false)
    } else if (action === "complete") {
      setIsRollMode(false)
      let studentRollData = []
      for (let index in studentsList) {
        studentRollData.push({ student_id: studentsList[index].id, roll_state: studentsList[index].attendance })
      }
      saveRollState({ student_roll_states: [...studentRollData] })
    } else if (action === "filter" && data?.students) {
      if (selectedType === "all") {
        setStudentsList([...data?.students])
      } else {
        const filteredData = [...data?.students].filter((student) => {
          return student?.attendance?.toLowerCase() === selectedType
        })
        setStudentsList([...filteredData])
      }
    }
  }

  // console.log({ studentsList })

  return (
    <HomeBoardContext.Provider
      value={{
        handleSelectField,
        handleInputQuery,
        searchText,
        sortOrder,
        sortBy,
      }}
    >
      <S.PageContainer>
        <Toolbar onItemClick={onToolbarAction} />

        {loadState === "loading" && (
          <CenteredContainer>
            <FontAwesomeIcon icon="spinner" size="2x" spin />
          </CenteredContainer>
        )}

        {loadState === "loaded" && studentsList && (
          <>
            {studentsList.map((s) => {
              return <StudentListTile key={s.id} isRollMode={isRollMode} student={s} handleUpdateAttendance={handleUpdateAttendance} />
            })}
          </>
        )}

        {loadState === "error" && (
          <CenteredContainer>
            <div>Failed to load</div>
          </CenteredContainer>
        )}
      </S.PageContainer>
      <ActiveRollOverlay isActive={isRollMode} attendanceCount={attendanceCount} onItemClick={onActiveRollAction} />
    </HomeBoardContext.Provider>
  )
}

type ToolbarAction = "roll" | "sort"
interface ToolbarProps {
  onItemClick: (e: any, action: ToolbarAction, value?: string) => void
}
const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { onItemClick } = props
  const { handleSelectField, handleInputQuery, sortBy, sortOrder, searchText } = useContext(HomeBoardContext)
  return (
    <S.ToolbarContainer>
      <S.FilterDiv onClick={(e) => onItemClick(e, "sort")}>
        <S.CustomSelect value={sortBy} onChange={handleSelectField}>
          <option value={SortingField.FirstName}>First Name</option>
          <option value={SortingField.LastName}>Last Name</option>
        </S.CustomSelect>
        <S.SortingDiv id="sortRef">{sortOrder === SortingOrder.ASC ? <FontAwesomeIcon icon={faSortUp} size="2x" /> : <FontAwesomeIcon icon={faSortDown} size="2x" />}</S.SortingDiv>
      </S.FilterDiv>
      <S.SearchInput type="text" placeholder="Search" value={searchText} onChange={handleInputQuery} />
      <S.Button onClick={(e) => onItemClick(e, "roll")}>Start Roll</S.Button>
    </S.ToolbarContainer>
  )
}

const S = {
  PageContainer: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 140px;
  `,
  ToolbarContainer: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    background-color: ${Colors.blue.base};
    padding: 6px 14px;
    font-weight: ${FontWeight.strong};
    border-radius: ${BorderRadius.default};
  `,
  Button: styled(Button)`
    && {
      padding: ${Spacing.u2};
      font-weight: ${FontWeight.strong};
      border-radius: ${BorderRadius.default};
    }
  `,
  FilterDiv: styled.div`
    display: inline-flex;
  `,
  CustomSelect: styled.select`
    background-color: #ffffff;
    width: 150px;
    border: 4px solid #1b4f90;
    border-radius: 4px 0 0 4px;
    padding: 4px 6px;
    font-weight: ${FontWeight.strong};
    line-height: inherit;
    outline: none;
  `,
  SortingDiv: styled.div`
    padding: 2px 4px;
    background-color: #1b4f90;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  `,
  SearchInput: styled.input`
    font-size: ${FontSize.u4};
    padding: 4px 6px;
    border: 4px solid #1b4f90;
    border-radius: 4px;
  `,
}
