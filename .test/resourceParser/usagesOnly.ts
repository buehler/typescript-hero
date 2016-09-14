@ClassDecorator
class Class {
    @PropertyDecorator()
    public notInitializedProperty;

    public typedProperty: TypedPropertyRef;

    public assignedProperty = AssignedProperty;
    
    @FunctionDecorator()
    public func(param: TypedParam, defaultParam = DefaultParam) {
    }

    private prv(param): ReturnValue {
        let a = PropertyAccess.To.My.Foobar;

        functionCall(MyProperty);

        indexedObject[Indexing];

        let b;
        b = AssignmentToVariable;

        console.log(a);
        console.log(b);

        () => () => () => NestedBinaryAssignment === true;

        return null;
    }
}
