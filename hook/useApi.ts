export const useApi = async (set: string) => {
  try {
    const res = await fetch(`https://adresse-api.com/${process.env.API_KEY}/${set}`, {
      headers: {
      "Content-Type": "application/json",
      "Access-control-Allow-Origin": "*"
      },
    });
    const updatedRes = await res.json();
    const data = updatedRes.data //! .data si besoin
    return data;
  } catch (error) {
    console.error(error);
  }
};