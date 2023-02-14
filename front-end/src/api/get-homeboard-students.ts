import { generateStudents } from "shared/helpers/data-generation"
import { httpMock } from "shared/helpers/http-mock"
import { add, addIfNotExist, get, LocalStorageKey } from "shared/helpers/local-storage"
import { ApiResponse } from "shared/interfaces/http.interface"
import { Person, StudentRollInput } from "shared/models/person"

export async function getHomeboardStudents(): Promise<ApiResponse<{ students: Person[] }>> {
  try {
    await httpMock({ randomFailure: true })
    return {
      success: true,
      students: addIfNotExist(LocalStorageKey.students, generateStudents(14)),
    }
  } catch (error) {
    return {
      success: false,
      error: {},
    }
  }
}

export async function updateStudentAttendance(data: StudentRollInput): Promise<ApiResponse<{}>> {
  try {
    const studentsInStorage = get<Person[]>(LocalStorageKey.students)
    const dataToSave = studentsInStorage && updateStudentRoll(data, studentsInStorage)
    add(LocalStorageKey.students, dataToSave)

    await httpMock({ randomFailure: true })
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {},
    }
  }
}

function updateStudentRoll(input: StudentRollInput, studentsInStorage?: Person[]) {
  const updatedStudentData = studentsInStorage?.map((studentObj) => {
    if (studentObj.id === input.student_id) {
      studentObj.attendance = input.roll_state
    }
    return studentObj
  })
  return updatedStudentData
}
