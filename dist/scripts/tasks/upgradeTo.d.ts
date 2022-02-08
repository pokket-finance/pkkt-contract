declare const main: ({ proxyname, implname, libraryname }: {
    proxyname: any;
    implname: any;
    libraryname: any;
}, { deployments, getNamedAccounts }: {
    deployments: any;
    getNamedAccounts: any;
}) => Promise<void>;
export default main;
