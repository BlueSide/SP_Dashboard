var testfilter = {
    filters: [
        {
            filters: [
                "TRLLevel = 1",
                "TRLLevel = 3"
            ],
            operator: "OR"
        },
        {
            filters:["Sector = Tech"],
            operator: "OR"
        }
    ],
    operator: "AND"
};
