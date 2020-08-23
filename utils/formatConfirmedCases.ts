interface History {
  更新日時: string
  検査実施人数: number
  陽性患者数: number
  入院: number
  軽症無症状: number
  中等症: number
  重症: number
  入院調整: number
  施設入所: number
  自宅療養: number
  調整: number
  退院: number
  死亡: number
  入院中: number
  軽症中等症: number
  転院: number
  備考: string
}

type DataType = {
  date: string
  data: History[]
}

export default (data: DataType) => {
  const length = data.data.length
  const latest = data.data[length - 1]
  return latest
}
