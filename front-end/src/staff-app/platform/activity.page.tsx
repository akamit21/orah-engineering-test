import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import moment from "moment"
import { FontSize, FontWeight, Spacing } from "shared/styles/styles"
import { useApi } from "shared/hooks/use-api"
import { Activity } from "shared/models/activity"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { Roll } from "shared/models/roll"
import { Colors } from "shared/styles/colors"

export const ActivityPage: React.FC = () => {
  const [getActivities, data, loadState] = useApi<{ activity: Activity[] }>({ url: "get-activities" })

  useEffect(() => {
    void getActivities()
  }, [getActivities])

  return (
    <S.Container>
      <S.Title>Activity Page</S.Title>
      {loadState === "loading" && (
        <CenteredContainer>
          <FontAwesomeIcon icon="spinner" size="2x" spin />
        </CenteredContainer>
      )}
      {loadState === "loaded" && data && (
        <S.DoughnutGrid>
          {[...data.activity].map((activity) => {
            return <DoughnutChart date={activity.date} entity={activity.entity} />
          })}
        </S.DoughnutGrid>
      )}
      {loadState === "error" && (
        <CenteredContainer>
          <div>Failed to load</div>
        </CenteredContainer>
      )}
    </S.Container>
  )
}

interface DoughnutChartProps {
  date: Date
  entity: Roll
}

const DoughnutChart: React.FC<DoughnutChartProps> = (props) => {
  ChartJS.register(ArcElement, Title, Tooltip, Legend)
  const { date, entity } = props
  const [attendanceCount, setAttendanceCount] = useState<number[]>([])

  useEffect(() => {
    let present = 0
    let absent = 0
    let late = 0
    if (entity?.student_roll_states)
      for (let index in entity.student_roll_states) {
        if (entity?.student_roll_states[index].roll_state === "present") {
          present++
        } else if (entity?.student_roll_states[index].roll_state === "absent") {
          absent++
        } else if (entity?.student_roll_states[index].roll_state === "late") {
          late++
        }
      }
    setAttendanceCount([present, late, absent])
  }, [entity?.student_roll_states])

  const data = {
    labels: ["Present", "Late", "Absent"],
    datasets: [
      {
        label: `Attendance for ${moment(date).format("DD-MMM-YYYY")}`,
        data: [...attendanceCount],
        borderColor: ["rgba(255,206,86,0.2)"],
        backgroundColor: ["rgb(19, 148, 59, 0.75)", "rgb(245, 166, 35, 0.65)", "rgb(155, 155, 155)"],
        hoverOffset: 4,
      },
    ],
  }
  const options = {
    plugins: {
      title: {
        display: true,
        text: `${entity.name}`,
        color: "#343f64",
        font: {
          size: 20,
        },
        padding: {
          top: 10,
          bottom: 5,
        },
        responsive: true,
        animation: {
          animateScale: true,
        },
      },
    },
  }

  return (
    <div>
      <Doughnut data={data} options={options} />
    </div>
  )
}

const S = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    width: 60%;
    margin: ${Spacing.u4} auto 0;
  `,
  Title: styled.h2`
    flex-grow: 1;
    padding: ${Spacing.u2};
    color: ${Colors.dark.base};
    font-weight: ${FontWeight.strong};
    font-size: ${FontSize.u2};
  `,
  DoughnutGrid: styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    grid-gap: 2rem;
    margin-top: 25px;
  `,
}
