/**
 * User type definition
 * @typedef {object} SchulinfoState
 */
const state = {
    assignedFeatureProperties: {},
    themeConfig: {
        "themen": [
            {
                "name": "Grundsätzliche Informationen",
                "isSelected": true,
                "attributes": [
                    "schulname",
                    "schulform",
                    "schultyp",
                    "schwerpunktschule",
                    "adresse_strasse_hausnr",
                    "adresse_ort",
                    "stadtteil",
                    "bezirk",
                    "schul_telefonnr",
                    "schul_email",
                    "schulportrait",
                    "schul_homepage",
                    "name_schulleiter",
                    "zustaendiges_rebbz",
                    "rebbz_homepage",
                    "schulaufsicht",
                    "offenetuer"]
            },
            {
                "name": "Schulgröße",
                "attributes": [
                    "anzahl_schueler_gesamt",
                    "zuegigkeit_kl_1",
                    "standortkl1",
                    "zuegigkeit_kl_5",
                    "standortkl5"
                ]
            },
            {
                "name": "Abschlüsse",
                "attributes": ["abschluss"]
            },
            {
                "name": "weitere Informationen",
                "attributes": [
                    "foerderart",
                    "auszeichnung",
                    "schuelerzeitung",
                    "schulische_ausrichtung",
                    "schulpartnerschaft",
                    "schulinspektion_link",
                    "schulportrait",
                    "einzugsgebiet",
                    "schulwahl_wohnort"
                ]
            },
            {
                "name": "Sprachen",
                "attributes": [
                    "fremdsprache_mit_klasse",
                    "bilingual",
                    "sprachzertifikat"
                ]
            },
            {
                "name": "Ganztag",
                "attributes": [
                    "ganztagsform",
                    "kernzeitbetreuung",
                    "ferienbetreuung_anteil",
                    "kernunterricht"
                ]
            },
            {
                "name": "Mittagsversorgung",
                "attributes": [
                    "mittagspause",
                    "kantine_vorh",
                    "wahlmoeglichkeit_essen",
                    "vegetarisch",
                    "nutzung_kantine_anteil",
                    "kiosk_vorh"
                ]
            },
            {
                "name": "Ansprechpartner",
                "attributes": [
                    "name_schulleiter",
                    "name_stellv_schulleiter",
                    "ansprechp_buero",
                    "ansprechp_klasse_1",
                    "ansprechp_klasse_5",
                    "name_oberstufenkoordinator"
                ]
            },
            {
                "name": "Oberstufenprofil",
                "attributes": [
                    "oberstufenprofil",
                    "standortoberstufe"
                ]
            }
        ]
    }
};

export default state;
