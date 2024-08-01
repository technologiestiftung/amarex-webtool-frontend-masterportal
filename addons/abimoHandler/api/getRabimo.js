// TODO: add url from env
const apiUrl = "https://0.0.0.0:443";

/**
 * Fetches data from Rabimo API asynchronously
 * @param {Object} payload - data to send
 * @returns {Promise} - a promise that resolves to the response data
 */
async function getMultiblock(payload) {
  try {
    const response = await fetch(`${apiUrl}/calculate_multiblock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data from Rabimo API:", error);
    throw error;
  }
}
/**
 * Tests Rabimo API
 * @param {*} endpoint
 */
async function getTest() {
  await fetch(`${apiUrl}/calculate_all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("[getRabimo] :: data::", data);
      return data;
    });
}

/**
 * Fetches data from Rabimo API asynchronously
 * @param {Object} payload - data to send
 * @returns {Promise} - a promise that resolves to the response data
 */
async function getMultiblockDeltaW(payload) {
  try {
    const response = await fetch(`${apiUrl}/calculate_multiblock_delta_w`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data from Rabimo API:", error);
    throw error;
  }
}

export default { getMultiblock, getTest, getMultiblockDeltaW };
