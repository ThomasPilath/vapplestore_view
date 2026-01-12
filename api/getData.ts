import { useApi } from "@/hook/useApi";

//Récupération des données depuis l'API
const fetchData = async () => {
  const set = `setting-in-url`
  const data = await useApi(set)
  //? si besoin de filtrer les données
  const filteredData = data.filter((item: any) => {
    return (
      item.type !== "type1" &&
      item.type !== "type1)2"
    );
  });
  return filteredData;
}

// fonction a appelé qui tri et renvoi les données voulu
export const getValue = async () => {
  const data = await fetchData()
  const value = data.filter((item: any) => {
    return item.value === "VALUE";
    });
  return value;
}