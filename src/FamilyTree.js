import React, { useEffect, useState } from "react";
import axios from "axios";
import * as d3 from "d3";

const API_URL = "https://script.google.com/macros/s/AKfycbydlaE_Yk2RN02TakwyrlBgmhjxiek7ulgY9mBS7rbEgacVl2uYyJoaZemzsLQG1M25nA/exec";

const FamilyTree = () => {
    const [data, setData] = useState([]);

    // Fungsi untuk memproses data dari server agar sesuai format yang dibutuhkan D3.js
    const processServerData = (data) => {
        return data.map(item => ({
            ...item,
            ID: String(item.ID),
            Ayah_ID: item.Ayah_ID ? String(item.Ayah_ID) : null,
            Ibu_ID: item.Ibu_ID ? String(item.Ibu_ID) : null,
        }));
    };

    // Mengambil data dari API saat komponen dimuat
    useEffect(() => {
        axios.get(API_URL)
            .then((response) => {
                const processedData = processServerData(response.data);
                setData(processedData);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, []);

    // Memvisualisasikan pohon setelah data berhasil diambil
    useEffect(() => {
        if (data.length > 0) {
            d3.select("#tree").selectAll("*").remove();

            const width = 800;
            const height = 600;

            const svg = d3.select("#tree")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(40, 40)");

            const treeLayout = d3.tree().size([width - 80, height - 80]);

            const root = d3.stratify()
                .id(d => d.ID)
                .parentId(d => d.Ayah_ID || d.Ibu_ID)(data);

            const treeData = treeLayout(d3.hierarchy(root));

            svg.selectAll(".link")
                .data(treeData.links())
                .enter()
                .append("line")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
                .attr("stroke", "#ccc");

            const nodes = svg.selectAll(".node")
                .data(treeData.descendants())
                .enter()
                .append("g")
                .attr("transform", d => `translate(${d.x},${d.y})`);

            nodes.append("circle")
                .attr("r", 10)
                .attr("fill", "steelblue");

            nodes.append("text")
                .attr("dy", -20)
                .attr("text-anchor", "middle")
                .text(d => d.data.data.Nama);
        }
    }, [data]);

    // Fungsi untuk menambah anggota keluarga baru
    const addMember = async () => {
        const newMember = {
            ID: prompt("ID:"),
            Nama: prompt("Nama:"),
            Ayah_ID: prompt("Ayah ID (kosongkan jika tidak ada):") || "",
            Ibu_ID: prompt("Ibu ID (kosongkan jika tidak ada):") || ""
        };

        try {
            const response = await axios.post(API_URL, newMember, {
                headers: { 'Content-Type': 'application/json' },
            });

            console.log(response.data); // Debug respons
            if (response.data.message === "Data added successfully") {
                alert("Data added successfully!");
                setData(prevData => [...prevData, newMember]);
            } else {
                alert("Error: " + response.data.message);
            }
        } catch (error) {
            console.error("Error adding member:", error);
            alert("Error adding data. Check console.");
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
            <div style={{ width: "40%", paddingRight: "20px" }}>
                <h2>Tabel Silsilah Keluarga</h2>
                <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama</th>
                            <th>Ayah ID</th>
                            <th>Ibu ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((member) => (
                            <tr key={member.ID}>
                                <td>{member.ID}</td>
                                <td>{member.Nama}</td>
                                <td>{member.Ayah_ID}</td>
                                <td>{member.Ibu_ID}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ width: "55%", border: "1px solid #ccc", height: "600px", margin: "auto" }} id="tree"></div>
            <button onClick={addMember} style={{ position: "fixed", bottom: "20px", right: "20px" }}>Tambah Anggota</button>
        </div>
    );
};

export default FamilyTree;
