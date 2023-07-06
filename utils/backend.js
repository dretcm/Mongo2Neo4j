let url = "", user='', password='';
const host = 'http://127.0.0.1:5000/';
const host_query = host + "mongo_query";


document.addEventListener('DOMContentLoaded', () => {
    const request = new XMLHttpRequest();
    request.open('GET', host + 'auth_neo4j');
    request.send();

    request.onload = () => {
        const data = JSON.parse(request.responseText);
            //console.log(data);
        url = data["url"];
        user = data["user"];
        password = data["password"];
    }

});

function relationship_match(){
    const driver = neo4j.driver(url, neo4j.auth.basic(user, password));
    const session = driver.session();

    const request = new XMLHttpRequest();
    const query = document.getElementById('query').value;

    request.open('POST', host_query);
    request.onload = () => {
        const json = JSON.parse(request.responseText);
        const container = document.getElementById('graph-container');
        const info = document.getElementById('inputs');
        container.innerHTML = "";

        if(json["success"]==true){
            console.log(json["data"]);
            const nodes = new vis.DataSet([]), edges= new vis.DataSet([]);
            const options = {};
            const focus = 'p_graph';
            const data_mongo = json["data"];
            const node_label = ["Movie", "genre"]
            const map_node = ["title","name"];

            let disperso = document.getElementById("disperso").checked;

            var configs = {skipValidation:true};
            if(disperso==false){
                configs.mappings = { '$': `${node_label[0]}{!${map_node[0]},@belongs_to_collection, *}`, '$.genres': `${node_label[1]}{!${map_node[1]},*}`};
            }

            session.run('CALL apoc.graph.fromDocument($data_mongo , $configs) YIELD graph AS p_graph RETURN p_graph', { data_mongo , configs})
            .then(result => {
                //console.log(result);
                const record = result.records[0].get(focus);
                //console.log(record);
                record.nodes.forEach(item => {
                    console.log(item);
                    const nodeObject = {
                        id: item.elementId,
                        //label: item.properties[map_node[item.labels[0]==node_label[0] ? 0 : 1]],
                        label: item.properties[map_node[map_node[0] in item.properties ? 0 : 1]],
                        title: JSON.stringify(item.properties)//node.start.labels[0]// Propiedad de nombre del nodo
                    };
                    nodes.add(nodeObject);
                });

                record.relationships.forEach(item => {
                    console.log(item);
                    const edgeObject = {
                        id: item.elementId,
                        from: item.startNodeElementId,
                        to: item.endNodeElementId,
                        label: item.type
                    };
                    edges.add(edgeObject);
                });

                const data = {nodes:nodes, edges:edges};
                const network = new vis.Network(container, data, options);
                network.setData(data);
                container.style.background = 'white';

                network.on("click", function(event) {
                    const nodeId = event.nodes[0]; // Obtiene el ID del nodo clicado
                    const node = nodes.get(nodeId); // Obtiene el objeto del nodo por su ID
                    const label = node.id; // Obtiene la etiqueta del nodo

                    if (document.getElementById("info") != null)
                        info.removeChild(document.getElementById("info"));

                    if(label!=undefined){
                        const div_con = document.createElement("div");
                        div_con.setAttribute("id", "info");
                        const p = document.createElement("p");
                        p.innerHTML = "ID: " + node.id + "<br> Data: " + node.title;
                        div_con.appendChild(p);
                        info.appendChild(div_con);
                    }
                });
            })
            .catch(error => {
                console.error('Error al ejecutar la consulta:', error);
                container.style.background = 'red';
            })
            .finally(() => {
                session.close();
            });
        }
        else{
            container.style.background = 'red';
            if (document.getElementById("info") != null)
                info.removeChild(document.getElementById("info"));
        }
    }

    const data = new FormData();
    data.append('query', query);
    request.send(data);
}

function match(){
    const request = new XMLHttpRequest();
    const query = document.getElementById('query').value;

    request.open('POST',  host_query);

    request.onload = () => {
        const json = JSON.parse(request.responseText);
        const container = document.getElementById('graph-container');
        const info = document.getElementById('inputs');
        container.innerHTML = "";

        if(json["success"]==true){
            console.log(json["data"]);
            const nodes = new vis.DataSet([]), edges= new vis.DataSet([]);
            const options = {};

            json["data"].forEach(record => {
                //console.log(record);
                const nodeObject = {
                    id: record['_id'],//con,
                    label: record['title'],
                    title: JSON.stringify(record)
                };
              nodes.add(nodeObject);
            });

            const data = {nodes:nodes, edges:edges};
            const network = new vis.Network(container, data, options);
            network.setData(data);
            container.style.background = 'white';

            network.on("click", function(event) {
            const nodeId = event.nodes[0]; // Obtiene el ID del nodo clicado
            const node = nodes.get(nodeId); // Obtiene el objeto del nodo por su ID
            const label = node.id; // Obtiene la etiqueta del nodo

            if (document.getElementById("info") != null)
              info.removeChild(document.getElementById("info"));

            if(label!=undefined){
                const div_con = document.createElement("div");
                div_con.setAttribute("id", "info");
                const p = document.createElement("p");
                p.innerHTML = "ID: " + node.id + "<br> Data: " + node.title;
                div_con.appendChild(p);
                info.appendChild(div_con);
                }
            });
        }
        else{
            container.style.background = 'red';
            if (document.getElementById("info") != null)
                info.removeChild(document.getElementById("info"));
        }
    }

    const data = new FormData();
    data.append('query', query);
    request.send(data);
}